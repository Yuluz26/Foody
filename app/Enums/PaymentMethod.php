<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cashier = 'cashier';
    case Qr = 'qr';

    public function label(): string
    {
        return match ($this) {
            self::Cashier => 'Bayar di kaunter',
            self::Qr => 'Imbas kod QR',
        };
    }
}
