<?php

namespace App\Exceptions;

use App\Enums\OrderType;
use RuntimeException;

/**
 * A business rule stopped the order. The message is safe to show to the customer.
 */
class OrderRejected extends RuntimeException
{
    public static function closed(): self
    {
        return new self('Maaf, kedai tidak menerima pesanan sekarang. Sila cuba lagi semasa waktu operasi.');
    }

    public static function typeDisabled(OrderType $type): self
    {
        return new self("Pilihan \"{$type->label()}\" tidak tersedia sekarang. Sila pilih jenis pesanan lain.");
    }

    /** @param list<string> $names */
    public static function unavailable(array $names): self
    {
        $list = $names === [] ? 'Sebahagian item' : implode(', ', $names);

        return new self("{$list} sudah habis atau tidak lagi dijual. Sila buang item tersebut dari troli.");
    }

    public static function invalidAddOns(string $productName): self
    {
        return new self("Add-on untuk {$productName} sudah tidak sah. Sila buang dan tambah semula item tersebut.");
    }
}
