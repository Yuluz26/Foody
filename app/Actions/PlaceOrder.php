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
use App\Models\User;
use App\Support\ImageUpload;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class PlaceOrder
{
    public function __construct(private readonly StockLedger $stock, private readonly IngredientLedger $ingredients) {}

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
     *     payment_proof?: UploadedFile|null,
     *     items: list<array{product_id: int|string, quantity: int|string, add_on_ids?: list<int|string>}>
     * }  $data
     *
     * @throws OrderRejected
     */
    public function handle(array $data): Order
    {
        return $this->place($data, null);
    }

    /**
     * An order keyed in at the counter by staff. Same pricing, stock and table rules as a guest order, but
     * it is not tied to a customer account, ignores opening hours and the online dine-in/takeaway
     * switches (the person is standing there), skips the guest and staff emails, and starts Confirmed.
     * Pass `paid => true` when the money has already changed hands.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws OrderRejected
     */
    public function handleForStaff(array $data, User $staff): Order
    {
        return $this->place($data, $staff);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function place(array $data, ?User $staff): Order
    {
        if ($existing = $this->findExisting($data['idempotency_key'])) {
            return $existing;
        }

        $settings = RestaurantSetting::current();
        $type = OrderType::from($data['type']);

        if ($staff === null) {
            if (! $settings->isAcceptingOrders()) {
                throw OrderRejected::closed();
            }

            if (($type === OrderType::DineIn && ! $settings->dine_in_enabled)
                || ($type === OrderType::Takeaway && ! $settings->takeaway_enabled)) {
                throw OrderRejected::typeDisabled($type);
            }
        }

        // Merge repeated lines for the same product with the same add-ons.
        $groups = $this->groupItems($data['items']);

        try {
            // Up to three tries: under a rush MySQL can still pick this checkout as a deadlock victim
            // and asks for the transaction to be restarted. Everything inside rolls back first.
            $order = DB::transaction(fn () => $this->create($data, $type, $groups, $staff), 3);
        } catch (UniqueConstraintViolationException $exception) {
            // Two identical submits raced past the first check; return the winner.
            if ($existing = $this->findExisting($data['idempotency_key'])) {
                return $existing;
            }

            throw $exception;
        }

        if ($staff === null) {
            $this->sendPlacedNotifications($order);
        }

        return $order;
    }

    /**
     * Never let a mail hiccup (or a blocked SMTP AUTH setting) fail an order that's already saved.
     * A diner ordering without an account leaves no email address, so only the shop is told.
     */
    private function sendPlacedNotifications(Order $order): void
    {
        if ($order->customer?->email !== null) {
            try {
                Mail::to($order->customer)->send(new OrderPlacedCustomerMail($order));
            } catch (Throwable $exception) {
                Log::error('Failed to send order-placed customer email', ['order_id' => $order->id, 'error' => $exception->getMessage()]);
            }
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
    private function create(array $data, OrderType $type, Collection $groups, ?User $staff = null): Order
    {
        $productIds = $groups->pluck('product_id')->unique()->all();

        $products = Product::query()
            ->orderable()
            ->whereKey($productIds)
            ->lockForUpdate()
            ->with('addOns')
            ->get()
            ->keyBy('id');

        $missingIds = array_diff($productIds, $products->keys()->all());

        if ($missingIds !== []) {
            throw OrderRejected::unavailable(
                Product::query()->whereKey($missingIds)->pluck('name')->all()
            );
        }

        // Same dish on several lines (different add-ons) draws from the same stock.
        foreach ($groups->groupBy('product_id') as $productId => $productGroups) {
            $product = $products[$productId];
            $wanted = (int) $productGroups->sum('quantity');

            if ($product->track_stock && $wanted > $product->stock_quantity) {
                throw OrderRejected::notEnoughStock($product->name, $product->stock_quantity);
            }
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

        $tableNumber = $type === OrderType::DineIn ? trim((string) $data['table_number']) : null;

        if ($tableNumber !== null) {
            // A free table has no order row yet, so lockForUpdate() on the availability query
            // alone would lock nothing — two racing checkouts could both see it as free. Lock
            // the single settings row instead: it always exists, so every dine-in checkout
            // serializes through it, and the availability check below becomes race-free.
            RestaurantSetting::query()->lockForUpdate()->first();

            $taken = Order::query()->active()
                ->where('type', OrderType::DineIn)
                ->where('table_number', $tableNumber)
                ->exists();

            if ($taken) {
                throw OrderRejected::tableTaken($tableNumber);
            }
        }

        $phone = Customer::normalizePhone($data['customer_phone'] ?? '');
        $name = trim((string) ($data['customer_name'] ?? '')) ?: 'Pelanggan kaunter';

        // A signed-in diner's order is tied to their account; anyone else orders as a guest and the order
        // keeps just the name and phone typed at checkout. Never look a customer up by phone — two
        // different accounts could share one (a shared family line, a typo), and matching on phone
        // would silently attach an order (and rewrite the name) onto the wrong account.
        $customer = $staff ? null : auth('customer')->user();
        $customer?->update(['last_order_at' => now()]);

        $paymentMethod = PaymentMethod::from($data['payment_method']);
        $paymentProof = $paymentMethod === PaymentMethod::Qr
            ? ImageUpload::replace($data['payment_proof'] ?? null, null, false, 'payment-proofs')
            : null;
        $paymentStatus = match (true) {
            $staff !== null && ($data['paid'] ?? false) => PaymentStatus::Paid,
            $paymentMethod === PaymentMethod::Qr && $staff === null => PaymentStatus::PendingVerification,
            default => PaymentStatus::Unpaid,
        };

        $order = Order::query()->create([
            'order_number' => 'TMP-'.Str::random(12),
            'idempotency_key' => $data['idempotency_key'],
            'source' => $staff ? 'pos' : 'online',
            'created_by' => $staff?->id,
            'customer_id' => $customer?->id,
            'customer_name' => $name,
            'customer_phone' => $phone,
            'type' => $type,
            'table_number' => $tableNumber,
            'notes' => filled($data['notes'] ?? null) ? trim($data['notes']) : null,
            'status' => $staff ? OrderStatus::Confirmed : OrderStatus::Pending,
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

        if ($staff) {
            $order->confirmed_at = now();
            $order->save();
        }

        $order->update(['order_number' => self::formatNumber($order->id)]);

        $items = $order->items()->createMany(array_map(fn (array $line) => Arr::except($line, 'add_ons'), $lines));

        foreach ($items as $index => $item) {
            if ($lines[$index]['add_ons'] !== []) {
                $item->addOns()->createMany($lines[$index]['add_ons']);
            }
        }

        $this->stock->sell($order, $lines);
        $this->ingredients->sell($order, $lines);

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
        return 'WR'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }
}
