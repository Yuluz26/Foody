<?php

namespace App\Enums;

enum StaffRole: string
{
    case Admin = 'admin';
    case Chef = 'chef';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Chef => 'Chef',
        };
    }
}
