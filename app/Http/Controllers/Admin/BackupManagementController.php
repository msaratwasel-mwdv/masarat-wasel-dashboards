<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupManagementController extends Controller
{
    /**
     * Display a listing of system backups and status.
     */
    public function index(): Response
    {
        $backupName = config('backup.backup.name', 'masarat-wasel');
        $diskName = config('backup.backup.destination.disks.0', 'local');
        
        $backupPath = "{$backupName}";
        $disk = Storage::disk($diskName);

        $backups = [];
        $totalBytes = 0;

        if ($disk->exists($backupPath)) {
            $files = $disk->files($backupPath);

            foreach ($files as $file) {
                if (str_ends_with($file, '.zip')) {
                    $size = $disk->size($file);
                    $totalBytes += $size;
                    $lastModified = $disk->lastModified($file);

                    $backups[] = [
                        'file_name' => basename($file),
                        'path' => $file,
                        'size_raw' => $size,
                        'size_formatted' => $this->formatBytes($size),
                        'created_at' => Carbon::createFromTimestamp($lastModified)->toIso8601String(),
                        'created_at_human' => Carbon::createFromTimestamp($lastModified)->diffForHumans(),
                        'created_at_formatted' => Carbon::createFromTimestamp($lastModified)->format('Y/m/d h:i A'),
                    ];
                }
            }
        }

        // Sort backups by latest first
        usort($backups, fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));

        $lastBackup = ! empty($backups) ? $backups[0] : null;

        $stats = [
            'total_count' => count($backups),
            'total_size' => $this->formatBytes($totalBytes),
            'last_backup_date' => $lastBackup ? $lastBackup['created_at_human'] : 'لا توجد نسخ بعد',
            'last_backup_formatted' => $lastBackup ? $lastBackup['created_at_formatted'] : '-',
            'backup_name' => $backupName,
            'disk_name' => $diskName,
        ];

        return Inertia::render('Admin/Backups/Index', [
            'backups' => $backups,
            'stats' => $stats,
        ]);
    }

    /**
     * Trigger a new manual backup immediately.
     */
    public function store(Request $request)
    {
        $onlyDb = $request->boolean('only_db', true);

        try {
            $options = [];
            if ($onlyDb) {
                $options['--only-db'] = true;
            }

            // Run backup
            $exitCode = Artisan::call('backup:run', $options);

            if ($exitCode === 0) {
                return back()->with('success', 'تم إنشاء النسخة الاحتياطية بنجاح.');
            }

            $output = Artisan::output();
            Log::warning('Backup completed with exit code: '.$exitCode, ['output' => $output]);

            return back()->with('success', 'تم استدعاء أمر النسخ الاحتياطي بنجاح.');
        } catch (\Throwable $e) {
            Log::error('Backup execution failed: '.$e->getMessage());

            return back()->with('error', 'تعذر إتمام عملية النسخ الاحتياطي: '.$e->getMessage());
        }
    }

    /**
     * Download a specific backup archive.
     */
    public function download(string $fileName): BinaryFileResponse
    {
        $safeFileName = basename($fileName);
        $backupName = config('backup.backup.name', 'masarat-wasel');
        $diskName = config('backup.backup.destination.disks.0', 'local');
        $disk = Storage::disk($diskName);
        $filePath = "{$backupName}/{$safeFileName}";

        if (! $disk->exists($filePath)) {
            abort(404, 'ملف النسخة الاحتياطية غير موجود');
        }

        $fullPath = $disk->path($filePath);

        return response()->download($fullPath, $safeFileName, [
            'Content-Type' => 'application/zip',
        ]);
    }

    /**
     * Delete a specific backup archive.
     */
    public function destroy(string $fileName)
    {
        $safeFileName = basename($fileName);
        $backupName = config('backup.backup.name', 'masarat-wasel');
        $diskName = config('backup.backup.destination.disks.0', 'local');
        $disk = Storage::disk($diskName);
        $filePath = "{$backupName}/{$safeFileName}";

        if ($disk->exists($filePath)) {
            $disk->delete($filePath);

            return back()->with('success', "تم حذف ملف النسخة الاحتياطية ({$safeFileName}) بنجاح.");
        }

        return back()->with('error', 'ملف النسخة الاحتياطية غير موجود.');
    }

    /**
     * Format bytes to human-readable format.
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }
}
