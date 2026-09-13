<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Unpaid = 'unpaid';
    case PendingVerification = 'pending_verification';
    case Paid = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Belum bayar',
            self::PendingVerification => 'Menunggu semakan',
            self::Paid => 'Sudah bayar',
        };
    }
}
