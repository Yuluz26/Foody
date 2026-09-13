<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Exceptions\OrderRejected;
use App\Mail\OrderPlacedCustomerMail;
use App\Mail\OrderPlacedStaffMail;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\RestaurantSetting;
use App\Support\ImageUpload;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class PlaceOrder
{
    /**
     * Create an order from validated checkout data.
     *
     * Prices, line totals and the order total are always taken from the database;
     * anything price-like the client sends is ignored. Submitting the same
     * idempotency key twice returns the order created by the first submit.
     *
     * @param  array{
     *     idempotency_key: string,
     *     type: string,
     *     table_number?: string|null,
     *     customer_name: string,
     *     customer_phone: string,
     *     notes?: string|null,
     *     payment_method: string,
     *     payment_proof?: \Illuminate\Http\UploadedFile|null,
     *     items: list<array{product_id: int|string, quantity: int|string, add_on_ids?: list<int|string>}>
     * }  $data
     *
     * @throws OrderRejected
     */
    public function handle(array $data): Order
    {
        if ($existing = $this->findExisting($data['idempotency_key'])) {
            return $existing;
        }

        $settings = RestaurantSetting::current();
        $type = OrderType::from($data['type']);

        if (! $settings->isAcceptingOrders()) {
            throw OrderRejected::closed();
        }

        if (($type === OrderType::DineIn && ! $settings->dine_in_enabled)
            || ($type === OrderType::Takeaway && ! $settings->takeaway_enabled)) {
            throw OrderRejected::typeDisabled($type);
        }

        // Merge repeated lines for the same product with the same add-ons.
        $groups = $this->groupItems($data['items']);

        try {
            $order = DB::transaction(fn () => $this->create($data, $type, $groups));
        } catch (UniqueConstraintViolationException $exception) {
            // Two identical submits raced past the first check; return the winner.
            if ($existing = $this->findExisting($data['idempotency_key'])) {
                return $existing;
            }

            throw $exception;
        }

        $this->sendPlacedNotifications($order);

        return $order;
    }

    /** Never let a mail hiccup (or a blocked SMTP AUTH setting) fail an order that's already saved. */
    private function sendPlacedNotifications(Order $order): void
    {
        try {
            Mail::to($order->customer)->send(new OrderPlacedCustomerMail($order));
        } catch (Throwable $exception) {
            Log::error('Failed to send order-placed customer email', ['order_id' => $order->id, 'error' => $exception->getMessage()]);
        }

        try {
            Mail::to(config('mail.from.address'))->send(new OrderPlacedStaffMail($order));
        } catch (Throwable $exception) {
            Log::error('Failed to send order-placed staff email', ['order_id' => $order->id, 'error' => $exception->getMessage()]);
        }
    }

    /**
     * Collapses repeated lines for the same product with the same set of add-ons into one,
     * summing their quantities.
     *
     * @param  list<array{product_id: int|string, quantity: int|string, add_on_ids?: list<int|string>}>  $items
     * @return Collection<string, array{product_id: int, quantity: int, add_on_ids: list<int>}>
     */
    private function groupItems(array $items): Collection
    {
        return collect($items)
            ->map(fn (array $item) => [
                'product_id' => (int) $item['product_id'],
                'quantity' => (int) $item['quantity'],
                'add_on_ids' => collect($item['add_on_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->sort()->values()->all(),
            ])
            ->groupBy(fn (array $item) => $item['product_id'].':'.implode(',', $item['add_on_ids']))
            ->map(fn (Collection $lines) => [
                'product_id' => $lines->first()['product_id'],
                'add_on_ids' => $lines->first()['add_on_ids'],
                'quantity' => (int) $lines->sum('quantity'),
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  Collection<string, array{product_id: int, quantity: int, add_on_ids: list<int>}>  $groups
     */
    private function create(array $data, OrderType $type, Collection $groups): Order
    {
        $productIds = $groups->pluck('product_id')->unique()->all();

        $products = Product::query()
            ->orderable()
            ->whereKey($productIds)
            ->with('addOns')
            ->get()
            ->keyBy('id');

        $missingIds = array_diff($productIds, $products->keys()->all());

        if ($missingIds !== []) {
            throw OrderRejected::unavailable(
                Product::query()->whereKey($missingIds)->pluck('name')->all()
            );
        }

        $lines = [];
        $subtotal = 0;

        foreach ($groups as $group) {
            $product = $products[$group['product_id']];
            $addOns = $product->addOns->whereIn('id', $group['add_on_ids']);

            if ($addOns->count() !== count($group['add_on_ids'])) {
                throw OrderRejected::invalidAddOns($product->name);
            }

            // Add-ons are a flat charge for the line, not multiplied by quantity: 2x a dish with one add-on
            // costs (price x 2) + add-on, not (price + add-on) x 2.
            $addOnsTotal = (int) $addOns->sum('price');
            $lineTotal = ($product->price * $group['quantity']) + $addOnsTotal;
            $subtotal += $lineTotal;

            $lines[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'unit_price' => $product->price,
                'add_ons_total' => $addOnsTotal,
                'quantity' => $group['quantity'],
                'line_total' => $lineTotal,
                'add_ons' => $addOns->map(fn ($addOn) => ['name' => $addOn->name, 'price' => $addOn->price])->values()->all(),
            ];
        }

        $phone = Customer::normalizePhone($data['customer_phone']);
        $name = trim($data['customer_name']);

        // The checkout route is auth:customer-gated, so a real account always exists here.
        // Don't look a customer up by phone anymore — two different accounts could share one
        // (a shared family line, a typo), and matching on phone would silently attach an
        // order (and rewrite the name) onto the wrong account.
        $customer = auth('customer')->user();
        $customer->update(['last_order_at' => now()]);

        $paymentMethod = PaymentMethod::from($data['payment_method']);
        $paymentProof = $paymentMethod === PaymentMethod::Qr
            ? ImageUpload::replace($data['payment_proof'] ?? null, null, false, 'payment-proofs')
            : null;
        $paymentStatus = $paymentMethod === PaymentMethod::Qr
            ? PaymentStatus::PendingVerification
            : PaymentStatus::Unpaid;

        $order = Order::query()->create([
            'order_number' => 'TMP-'.Str::random(12),
            'idempotency_key' => $data['idempotency_key'],
            'customer_id' => $customer->id,
            'customer_name' => $name,
            'customer_phone' => $phone,
            'type' => $type,
            'table_number' => $type === OrderType::DineIn ? trim((string) $data['table_number']) : null,
            'notes' => filled($data['notes'] ?? null) ? trim($data['notes']) : null,
            'status' => OrderStatus::Pending,
            'subtotal' => $subtotal,
            // No service charge or tax in MVP; total equals subtotal.
            'total' => $subtotal,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'payment_proof' => $paymentProof,
        ]);

        // Avoids a lazy-load violation (lazy loading is disabled outside production) when the
        // notification mail below reads $order->customer — it's already in memory right here.
        $order->setRelation('customer', $customer);

        $order->update(['order_number' => self::formatNumber($order->id)]);

        $items = $order->items()->createMany(array_map(fn (array $line) => Arr::except($line, 'add_ons'), $lines));

        foreach ($items as $index => $item) {
            if ($lines[$index]['add_ons'] !== []) {
                $item->addOns()->createMany($lines[$index]['add_ons']);
            }
        }

        Log::info('Order placed', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'type' => $type->value,
            'items' => count($lines),
            'total' => $subtotal,
        ]);

        return $order;
    }

    private function findExisting(string $key): ?Order
    {
        return Order::query()->where('idempotency_key', $key)->first();
    }

    public static function formatNumber(int $id): string
    {
        return 'FD'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }
}
