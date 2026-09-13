<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Concerns\HasImageUrl;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'order_number', 'idempotency_key', 'customer_id', 'customer_name', 'customer_phone',
    'type', 'table_number', 'notes', 'status', 'subtotal', 'total',
    'payment_method', 'payment_status', 'payment_proof',
])]
class Order extends Model
{
    use HasFactory, HasImageUrl, HasUlids;

    /** Only the public id is a ULID; the primary key stays an auto-increment integer. */
    public function uniqueIds(): array
    {
        return ['public_id'];
    }

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'type' => OrderType::class,
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
            'subtotal' => 'integer',
            'total' => 'integer',
            'confirmed_at' => 'datetime',
            'preparing_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'cancelled_by_customer' => 'boolean',
        ];
    }

    /** Named explicitly rather than relying on HasImageUrl's generic `image`/`imageUrl()` convention, which is wired to a differently-named column. */
    protected function paymentProofUrl(): Attribute
    {
        return Attribute::get(fn () => static::resolveImageUrl($this->payment_proof));
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @param Builder<Order> $query */
    public function scopeActive(Builder $query): void
    {
        $query->whereIn('status', array_map(
            fn (OrderStatus $status) => $status->value,
            array_filter(OrderStatus::cases(), fn (OrderStatus $status) => $status->isActive()),
        ));
    }

    /** @param Builder<Order> $query */
    public function scopeToday(Builder $query): void
    {
        $query->whereBetween('created_at', [now()->startOfDay(), now()->endOfDay()]);
    }
}
