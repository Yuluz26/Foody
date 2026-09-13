<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUpload
{
    /** Returns the value to store: a new upload, null when removed, or the current value unchanged. */
    public static function replace(?UploadedFile $file, ?string $current, bool $remove, string $directory): ?string
    {
        if ($file) {
            self::delete($current);

            return $file->store($directory, 'public');
        }

        if ($remove) {
            self::delete($current);

            return null;
        }

        return $current;
    }

    /** Only uploaded files are deleted; external stock URLs are left alone. */
    public static function delete(?string $path): void
    {
        if (filled($path) && ! Str::startsWith($path, ['http://', 'https://'])) {
            Storage::disk('public')->delete($path);
        }
    }
}
