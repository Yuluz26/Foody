<?php

namespace App\Actions;

use App\Enums\StockMovementType;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * The only place that changes a product's stock. Every change is written to
 * stock_movements together with the balance it left behind, so the count can
 * always be explained and an order's effect can be reversed exactly once.
 */
class StockLedger
{
    /**
     * Apply a signed change to a tracked product and log it. The balance never drops below zero;
     * if the change is larger than what is left, the logged change is trimmed to match.
     */
    public function record(Product $product, StockMovementType $type, int $change, ?User $user = null, ?string $note = null, ?Order $order = null): StockMovement
    {
        return DB::transaction(function () use ($product, $type, $change, $user, $note, $order) {
            $locked = Product::query()->lockForUpdate()->findOrFail($product->id);

            $balance = max(0, $locked->stock_quantity + $change);
            $applied = $balance - $locked->stock_quantity;

            $locked->update(['stock_quantity' => $balance]);
            $product->stock_quantity = $balance;

            return StockMovement::query()->create([
                'product_id' => $locked->id,
                'order_id' => $order?->id,
                'user_id' => $user?->id,
                'type' => $type,
                'delta' => $applied,
                'balance_after' => $balance,
                'note' => filled($note) ? trim($note) : null,
            ]);
        });
    }

    /** Set the counted balance (a stocktake). Logs the difference as an adjustment. */
    public function setBalance(Product $product, int $counted, ?User $user = null, ?string $note = null): StockMovement
    {
        $current = Product::query()->whereKey($product->id)->value('stock_quantity');

        return $this->record($product, StockMovementType::Adjustment, $counted - (int) $current, $user, $note);
    }

    /**
     * Take stock for a freshly placed order. Lines are the ones PlaceOrder built; only tracked
     * products are touched. Caller has already checked there is enough.
     *
     * @param  list<array{product_id: int, quantity: int}>  $lines
     */
    public function sell(Order $order, array $lines): void
    {
        $quantities = collect($lines)->groupBy('product_id')->map(fn ($rows) => (int) $rows->sum('quantity'));

        Product::query()->tracked()->whereKey($quantities->keys())->get()->each(
            fn (Product $product) => $this->record($product, StockMovementType::Sale, -$quantities[$product->id], null, null, $order)
        );
    }

    /**
     * Bring an order's stock effect in line with what it contains now. A cancelled order should
     * hold nothing; an active one should hold exactly its item quantities. Safe to call repeatedly:
     * it only moves the difference between what was taken and what the order needs.
     */
    public function syncOrder(Order $order, ?User $user = null): void
    {
        DB::transaction(function () use ($order, $user) {
            // Two syncs of one order at once (a double-tapped cancel, staff and diner together) would
            // both read the same "taken" and give it back twice; the order row lock lines them up.
            Order::query()->whereKey($order->id)->lockForUpdate()->value('id');

            $taken = StockMovement::query()
                ->where('order_id', $order->id)
                ->whereIn('type', [StockMovementType::Sale, StockMovementType::Return])
                ->get()
                ->groupBy('product_id')
                ->map(fn ($rows) => -(int) $rows->sum('delta'));

            if ($taken->isEmpty()) {
                return;
            }

            $needed = $order->status->value === 'cancelled'
                ? collect()
                : $order->items()->whereIn('product_id', $taken->keys())->get()->groupBy('product_id')->map(fn ($rows) => (int) $rows->sum('quantity'));

            foreach (Product::query()->whereKey($taken->keys())->get() as $product) {
                $difference = (int) ($needed[$product->id] ?? 0) - (int) $taken[$product->id];

                if ($difference === 0) {
                    continue;
                }

                $type = $difference < 0 ? StockMovementType::Return : StockMovementType::Sale;
                $this->record($product, $type, -$difference, $user, null, $order);
            }
        });
    }
}
