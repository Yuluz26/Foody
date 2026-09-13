<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Image columns hold either an uploaded file path on the public disk
 * or an absolute URL (seeded stock photography).
 */
trait HasImageUrl
{
    public static function resolveImageUrl(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://'])) {
            return $value;
        }

        return Storage::disk('public')->url($value);
    }

    public static function isUploadedImage(?string $value): bool
    {
        return filled($value) && ! Str::startsWith($value, ['http://', 'https://']);
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn () => static::resolveImageUrl($this->image));
    }
}
