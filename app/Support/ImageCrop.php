<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ImageCrop
{
    /**
     * Center-crops the upload to the given width/height ratio and stores it as a JPEG,
     * so every slide is the same shape regardless of what the staff member uploaded.
     */
    public static function centerCropToRatio(UploadedFile $file, float $ratio, string $directory, int $maxWidth = 1600): string
    {
        $source = self::read($file);
        $width = imagesx($source);
        $height = imagesy($source);

        if ($width / $height > $ratio) {
            $cropHeight = $height;
            $cropWidth = (int) round($height * $ratio);
        } else {
            $cropWidth = $width;
            $cropHeight = (int) round($width / $ratio);
        }

        $srcX = (int) round(($width - $cropWidth) / 2);
        $srcY = (int) round(($height - $cropHeight) / 2);

        $outWidth = min($maxWidth, $cropWidth);
        $outHeight = (int) round($outWidth / $ratio);

        $canvas = imagecreatetruecolor($outWidth, $outHeight);
        imagecopyresampled($canvas, $source, 0, 0, $srcX, $srcY, $outWidth, $outHeight, $cropWidth, $cropHeight);

        ob_start();
        imagejpeg($canvas, quality: 85);
        $contents = ob_get_clean();

        imagedestroy($source);
        imagedestroy($canvas);

        $path = trim($directory, '/').'/'.Str::random(24).'.jpg';
        Storage::disk('public')->put($path, $contents);

        return $path;
    }

    /** @return \GdImage */
    private static function read(UploadedFile $file)
    {
        $path = $file->getRealPath();

        $image = match ($file->getMimeType()) {
            'image/png' => imagecreatefrompng($path),
            'image/webp' => imagecreatefromwebp($path),
            default => imagecreatefromjpeg($path),
        };

        if ($image === false) {
            throw new RuntimeException('Gambar tidak dapat dibaca.');
        }

        return $image;
    }
}
