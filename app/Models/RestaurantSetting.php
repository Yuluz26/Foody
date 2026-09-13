<?php

namespace App\Models;

use App\Models\Concerns\HasImageUrl;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name', 'logo', 'description', 'phone', 'address', 'opens_at', 'closes_at',
    'currency', 'ordering_enabled', 'dine_in_enabled', 'takeaway_enabled', 'table_count',
    'qr_code', 'payment_instructions',
])]
class RestaurantSetting extends Model
{
    use HasImageUrl;

    /** Mirrors the column defaults so a freshly created row is usable before it is reloaded. */
    protected $attributes = [
        'currency' => 'MYR',
        'ordering_enabled' => true,
        'dine_in_enabled' => true,
        'takeaway_enabled' => true,
        'table_count' => 12,
    ];

    protected function casts(): array
    {
        return [
            'ordering_enabled' => 'boolean',
            'dine_in_enabled' => 'boolean',
            'takeaway_enabled' => 'boolean',
            'table_count' => 'integer',
        ];
    }

    /** The single settings row, created with safe defaults on first use. */
    public static function current(): self
    {
        return static::query()->oldest('id')->first()
            ?? static::query()->create(['name' => config('app.name', 'Foody')]);
    }

    protected function logoUrl(): Attribute
    {
        return Attribute::get(fn () => static::resolveImageUrl($this->logo));
    }

    protected function qrCodeUrl(): Attribute
    {
        return Attribute::get(fn () => static::resolveImageUrl($this->qr_code));
    }

    /** No hours configured means the shop is treated as always open. */
    public function isOpenNow(): bool
    {
        if (blank($this->opens_at) || blank($this->closes_at)) {
            return true;
        }

        $now = now()->format('H:i:s');
        $opens = substr($this->opens_at, 0, 8);
        $closes = substr($this->closes_at, 0, 8);

        if ($opens === $closes) {
            return true;
        }

        return $opens < $closes
            ? $now >= $opens && $now < $closes
            : $now >= $opens || $now < $closes;
    }

    public function isAcceptingOrders(): bool
    {
        return $this->ordering_enabled
            && ($this->dine_in_enabled || $this->takeaway_enabled)
            && $this->isOpenNow();
    }
}
