<?php

namespace Database\Seeders;

use App\Actions\PlaceOrder;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Backfills a couple of years of finished (mostly completed, some cancelled) orders with
 * varied historical timestamps, purely so the admin Reports trend chart and history table
 * have something real to show. Only final-status orders are generated, so nothing lands in
 * the live "needs action" queue. Not wired into DatabaseSeeder — run it explicitly:
 * php artisan db:seed --class=DemoOrderHistorySeeder
 */
class DemoOrderHistorySeeder extends Seeder
{
    public function run(): void
    {
        $products = Product::query()->get();

        if ($products->isEmpty()) {
            $this->command?->warn('No products found — run MenuSeeder first.');

            return;
        }

        $customers = Customer::factory()->count(8)->create();

        DB::transaction(function () use ($products, $customers) {
            // Dense recent window: populates both the "day" (14d) and "week" (12wk) chart views.
            $this->seedWindow(now()->subDays(90), now(), 140, $products, $customers);

            // Sparser mid window: extends the "month" (12mo) view beyond the last 90 days.
            $this->seedWindow(now()->subMonths(12), now()->subDays(90), 40, $products, $customers);

            // Light trickle further back: gives the "year" (5yr) view something in each year.
            $this->seedWindow(now()->subYears(4), now()->subMonths(12), 25, $products, $customers);
        });

        $this->command?->info('Demo order history seeded (205 orders).');
    }

    /** @param Collection<int, Product> $products
     *  @param Collection<int, Customer> $customers */
    private function seedWindow(Carbon $from, Carbon $to, int $count, Collection $products, Collection $customers): void
    {
        for ($i = 0; $i < $count; $i++) {
            $this->makeOrder($this->randomTimestampBetween($from, $to), $products, $customers);
        }
    }

    private function randomTimestampBetween(Carbon $from, Carbon $to): Carbon
    {
        return Carbon::createFromTimestamp(random_int($from->timestamp, $to->timestamp));
    }

    /** @param Collection<int, Product> $products
     *  @param Collection<int, Customer> $customers */
    private function makeOrder(Carbon $at, Collection $products, Collection $customers): void
    {
        $customer = $customers->random();
        $type = fake()->boolean(65) ? OrderType::DineIn : OrderType::Takeaway;

        // Mostly completed (that's what the chart tracks), with a realistic minority cancelled.
        // Only final statuses — nothing here should ever sit in the live "needs action" queue.
        $status = fake()->randomElement([
            OrderStatus::Completed, OrderStatus::Completed, OrderStatus::Completed,
            OrderStatus::Completed, OrderStatus::Completed, OrderStatus::Cancelled,
        ]);

        $lines = collect(range(1, random_int(1, 4)))
            ->map(fn () => $products->random())
            ->unique('id')
            ->map(function (Product $product) {
                $quantity = random_int(1, 3);

                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $product->price,
                    'quantity' => $quantity,
                    'line_total' => $product->price * $quantity,
                    'add_ons_total' => 0,
                ];
            })
            ->values();

        $subtotal = (int) $lines->sum('line_total');

        $order = Order::create([
            'order_number' => 'TMP-'.Str::random(12),
            'idempotency_key' => (string) Str::uuid(),
            'customer_id' => $customer->id,
            'customer_name' => $customer->name,
            'customer_phone' => $customer->phone,
            'type' => $type,
            'table_number' => $type === OrderType::DineIn ? (string) random_int(1, 20) : null,
            'status' => $status,
            'subtotal' => $subtotal,
            'total' => $subtotal,
            'payment_method' => fake()->randomElement([PaymentMethod::Cashier, PaymentMethod::Qr]),
            'payment_status' => $status === OrderStatus::Cancelled ? PaymentStatus::Unpaid : PaymentStatus::Paid,
        ]);

        $order->update(['order_number' => PlaceOrder::formatNumber($order->id)]);
        $order->items()->createMany($lines->all());

        // Backdate the lifecycle instead of letting Eloquent stamp "now" on this save.
        $order->timestamps = false;
        $order->created_at = $at;
        $order->updated_at = $at;

        if ($status === OrderStatus::Cancelled) {
            $order->cancelled_at = $at->copy()->addMinutes(3);
        } else {
            $order->confirmed_at = $at->copy()->addMinutes(2);
            $order->preparing_at = $at->copy()->addMinutes(6);
            $order->ready_at = $at->copy()->addMinutes(18);
            $order->completed_at = $at->copy()->addMinutes(25);
        }

        $order->save();
    }
}
