<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

class OptimizeImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'images:optimize 
                            {--path= : Relative path within storage/app/public to scan (e.g. avatars, incidents)}
                            {--max-width=1600 : Maximum width in pixels}
                            {--max-height=1600 : Maximum height in pixels}
                            {--quality=82 : JPEG and WebP compression quality (1-100)}
                            {--min-size=10 : Minimum file size in KB to consider for optimization}
                            {--dry-run : Simulate and preview potential savings without modifying files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Optimize, compress, and downscale user-uploaded images in storage/app/public';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        @ini_set('memory_limit', '512M');

        if (! extension_loaded('gd')) {
            $this->error('The PHP GD extension is required for image optimization.');

            return self::FAILURE;
        }

        $baseDir = storage_path('app/public');
        $subPath = $this->option('path');

        $targetDir = $subPath ? $baseDir.DIRECTORY_SEPARATOR.ltrim($subPath, '/\\') : $baseDir;

        if (! is_dir($targetDir)) {
            $this->error("Directory not found: {$targetDir}");

            return self::FAILURE;
        }

        $maxWidth = (int) $this->option('max-width');
        $maxHeight = (int) $this->option('max-height');
        $quality = (int) $this->option('quality');
        $minSizeKb = (int) $this->option('min-size');
        $isDryRun = (bool) $this->option('dry-run');

        $this->info('Scanning for images in: '.$targetDir);
        if ($isDryRun) {
            $this->warn('DRY RUN MODE ENABLED: No files will be modified.');
        }

        $imageFiles = $this->collectImages($targetDir, $minSizeKb);
        $totalFiles = count($imageFiles);

        if ($totalFiles === 0) {
            $this->info('No images found matching criteria.');

            return self::SUCCESS;
        }

        $this->info("Found {$totalFiles} images to analyze.");
        $progressBar = $this->output->createProgressBar($totalFiles);
        $progressBar->start();

        $scannedCount = 0;
        $optimizedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        $totalOriginalBytes = 0;
        $totalNewBytes = 0;

        foreach ($imageFiles as $filePath) {
            $scannedCount++;
            $originalBytes = (int) filesize($filePath);
            $totalOriginalBytes += $originalBytes;

            $result = $this->processImage($filePath, $maxWidth, $maxHeight, $quality, $isDryRun);

            if ($result['status'] === 'optimized') {
                $optimizedCount++;
                $totalNewBytes += $result['new_size'];
            } elseif ($result['status'] === 'skipped') {
                $skippedCount++;
                $totalNewBytes += $originalBytes;
            } else {
                $failedCount++;
                $totalNewBytes += $originalBytes;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $savedBytes = max(0, $totalOriginalBytes - $totalNewBytes);
        $savedMb = round($savedBytes / (1024 * 1024), 2);
        $origMb = round($totalOriginalBytes / (1024 * 1024), 2);
        $newMb = round($totalNewBytes / (1024 * 1024), 2);
        $percentSaved = $totalOriginalBytes > 0 ? round(($savedBytes / $totalOriginalBytes) * 100, 1) : 0;

        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Scanned', $scannedCount],
                ['Optimized', $optimizedCount],
                ['Skipped (already optimal)', $skippedCount],
                ['Failed / Unreadable', $failedCount],
                ['Original Size', "{$origMb} MB"],
                ['Optimized Size', "{$newMb} MB"],
                ['Total Space Saved', "{$savedMb} MB ({$percentSaved}%)"],
                ['Mode', $isDryRun ? 'DRY RUN (Preview Only)' : 'MODIFIED IN PLACE'],
            ]
        );

        return self::SUCCESS;
    }

    /**
     * Recursively collect eligible image paths.
     *
     * @return array<int, string>
     */
    protected function collectImages(string $directory, int $minSizeKb): array
    {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        $files = [];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, $allowedExtensions, true)) {
                    $sizeKb = $file->getSize() / 1024;
                    if ($sizeKb >= $minSizeKb) {
                        $files[] = $file->getRealPath();
                    }
                }
            }
        }

        return $files;
    }

    /**
     * Process a single image file.
     *
     * @return array{status: string, new_size: int}
     */
    protected function processImage(string $path, int $maxWidth, int $maxHeight, int $quality, bool $isDryRun): array
    {
        $originalSize = (int) filesize($path);
        $data = @file_get_contents($path);

        if ($data === false) {
            return ['status' => 'failed', 'new_size' => $originalSize];
        }

        $image = @imagecreatefromstring($data);
        if (! $image) {
            return ['status' => 'failed', 'new_size' => $originalSize];
        }

        // Correct EXIF orientation for JPEG if applicable
        $image = $this->fixOrientation($path, $image);

        $origWidth = imagesx($image);
        $origHeight = imagesy($image);

        // Determine target dimensions
        $targetWidth = $origWidth;
        $targetHeight = $origHeight;

        if ($origWidth > $maxWidth || $origHeight > $maxHeight) {
            $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
            $targetWidth = max(1, (int) round($origWidth * $ratio));
            $targetHeight = max(1, (int) round($origHeight * $ratio));
        }

        // Resample if resized or palette conversion
        $needsResize = ($targetWidth !== $origWidth || $targetHeight !== $origHeight);

        $finalImage = $image;
        if ($needsResize) {
            $resized = imagecreatetruecolor($targetWidth, $targetHeight);
            // Handle transparency for PNG / WebP
            imagealphablending($resized, false);
            imagesavealpha($resized, true);

            imagecopyresampled($resized, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $origWidth, $origHeight);
            $finalImage = $resized;
        }

        $tempPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'opt_'.uniqid('', true);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        $savedSuccessfully = false;

        if (in_array($ext, ['jpg', 'jpeg'], true)) {
            $savedSuccessfully = @imagejpeg($finalImage, $tempPath, $quality);
        } elseif ($ext === 'png') {
            imagealphablending($finalImage, false);
            imagesavealpha($finalImage, true);
            $savedSuccessfully = @imagepng($finalImage, $tempPath, 9);
        } elseif ($ext === 'webp') {
            $savedSuccessfully = @imagewebp($finalImage, $tempPath, $quality);
        }

        // Free memory
        if ($finalImage !== $image) {
            imagedestroy($finalImage);
        }
        imagedestroy($image);

        if (! $savedSuccessfully || ! file_exists($tempPath)) {
            @unlink($tempPath);

            return ['status' => 'failed', 'new_size' => $originalSize];
        }

        $tempSize = (int) filesize($tempPath);

        // Only replace if the new image is smaller
        if ($tempSize < $originalSize) {
            if (! $isDryRun) {
                // Atomic replace
                @copy($tempPath, $path);
            }
            @unlink($tempPath);

            return ['status' => 'optimized', 'new_size' => $tempSize];
        }

        // If new size is not smaller, keep original
        @unlink($tempPath);

        return ['status' => 'skipped', 'new_size' => $originalSize];
    }

    /**
     * Fix EXIF orientation for mobile camera photos.
     *
     * @param  \GdImage  $image
     * @return \GdImage
     */
    protected function fixOrientation(string $path, $image)
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (! in_array($ext, ['jpg', 'jpeg'], true)) {
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
