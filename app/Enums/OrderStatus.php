<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Preparing = 'preparing';
    case Ready = 'ready';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /** The normal forward flow, in order. Cancelled sits outside it. */
    public const FLOW = [
        self::Pending,
        self::Confirmed,
        self::Preparing,
        self::Ready,
        self::Completed,
    ];

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pesanan diterima',
            self::Confirmed => 'Disahkan',
            self::Preparing => 'Sedang Disediakan',
            self::Ready => 'Siap',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function isActive(): bool
    {
        return in_array($this, [self::Pending, self::Confirmed, self::Preparing, self::Ready], true);
    }

    public function isFinal(): bool
    {
        return $this === self::Completed || $this === self::Cancelled;
    }

    /**
     * Staff may move an order forward (skipping steps is allowed) or cancel it,
     * but never move it backwards or reopen a finished order.
     */
    public function canTransitionTo(self $to): bool
    {
        if ($this->isFinal() || $to === $this) {
            return false;
        }

        if ($to === self::Cancelled) {
            return true;
        }

        return array_search($to, self::FLOW, true) > array_search($this, self::FLOW, true);
    }

    /** @return list<self> */
    public function nextStatuses(): array
    {
        return array_values(array_filter(self::cases(), fn (self $status) => $this->canTransitionTo($status)));
    }

    public function timestampColumn(): ?string
    {
        return match ($this) {
            self::Pending => null,
            default => $this->value.'_at',
        };
    }
}
