<?php

namespace App\Services;

use Illuminate\Http\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizerService
{
    /**
     * Optimize an uploaded image, convert to WebP, and store on the given disk.
     * Non-image files (e.g. PDF, docx) are stored as-is without modification.
     */
    public function optimizeAndStore(
        UploadedFile $file,
        string $folder,
        string $disk = 'public',
        ?int $maxWidth = null,
        ?int $maxHeight = null,
        int $quality = 82
    ): string {
        $folder = trim($folder, '/\\');
        $mime = $file->getMimeType() ?? '';

        // Only process standard raster images
        $supportedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
        if (! in_array($mime, $supportedMimes, true) || ! extension_loaded('gd')) {
            return $file->store($folder, $disk);
        }

        // Determine default dimensions based on upload category
        if ($maxWidth === null || $maxHeight === null) {
            $categoryDims = $this->resolveDimensionsForFolder($folder);
            $maxWidth = $maxWidth ?? $categoryDims['width'];
            $maxHeight = $maxHeight ?? $categoryDims['height'];
        }

        $imageContent = @file_get_contents($file->getRealPath());
        if ($imageContent === false) {
            return $file->store($folder, $disk);
        }

        $image = @imagecreatefromstring($imageContent);
        if (! $image) {
            return $file->store($folder, $disk);
        }

        // Correct orientation for photos taken by smartphones
        $image = $this->fixOrientation($file->getRealPath(), $image);

        $origWidth = imagesx($image);
        $origHeight = imagesy($image);

        $targetWidth = $origWidth;
        $targetHeight = $origHeight;

        if ($origWidth > $maxWidth || $origHeight > $maxHeight) {
            $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
            $targetWidth = max(1, (int) round($origWidth * $ratio));
            $targetHeight = max(1, (int) round($origHeight * $ratio));
        }

        // Resample image
        $finalImage = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($finalImage, false);
        imagesavealpha($finalImage, true);
        imagecopyresampled($finalImage, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $origWidth, $origHeight);

        // Save as WebP in temporary storage
        $tempPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'wasel_opt_'.uniqid('', true).'.webp';
        $saved = @imagewebp($finalImage, $tempPath, $quality);

        imagedestroy($image);
        imagedestroy($finalImage);

        if (! $saved || ! file_exists($tempPath)) {
            @unlink($tempPath);

            return $file->store($folder, $disk);
        }

        // Store file onto the target disk
        $filename = Str::random(40).'.webp';
        $storedPath = Storage::disk($disk)->putFileAs($folder, new File($tempPath), $filename);

        @unlink($tempPath);

        return $storedPath ?: $file->store($folder, $disk);
    }

    /**
     * Resolve default optimal dimensions based on the folder path.
     *
     * @return array{width: int, height: int}
     */
    protected function resolveDimensionsForFolder(string $folder): array
    {
        $f = strtolower($folder);

        // Avatars / profile photos: 800x800 is plenty for retina display
        if (str_contains($f, 'avatar') || str_contains($f, 'guardians') || str_contains($f, 'students') || str_contains($f, 'users') || str_contains($f, 'teachers')) {
            return ['width' => 800, 'height' => 800];
        }

        // Logos: 1000x1000
        if (str_contains($f, 'logo')) {
            return ['width' => 1000, 'height' => 1000];
        }

        // Incidents, receipts, ID cards, bus photos: 1600x1600 preserves sharpness of text
        return ['width' => 1600, 'height' => 1600];
    }

    /**
     * Fix EXIF orientation for smartphone photos.
     *
     * @param  \GdImage  $image
     * @return \GdImage
     */
    protected function fixOrientation(string $path, $image)
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        if (! $exif || ! isset($exif['Orientation'])) {
            return $image;
        }

        $orientation = (int) $exif['Orientation'];
        $rotated = null;

        switch ($orientation) {
            case 3:
                $rotated = imagerotate($image, 180, 0);
                break;
            case 6:
                $rotated = imagerotate($image, -90, 0);
                break;
            case 8:
                $rotated = imagerotate($image, 90, 0);
                break;
        }

        if ($rotated) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }
}
