<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class BackupManagementTest extends TestCase
{
    use CreatesUsers;

    public function test_admin_can_view_backups_dashboard(): void
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->get(route('admin.backups.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Backups/Index')
            ->has('backups')
            ->has('stats')
        );
    }

    public function test_admin_can_trigger_backup_creation(): void
    {
        $admin = $this->createAdmin();

        // Mock artisan call
        Artisan::shouldReceive('call')
            ->with('backup:run', ['--only-db' => true])
            ->once()
            ->andReturn(0);

        $response = $this->actingAs($admin)->post(route('admin.backups.store'), [
            'only_db' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_admin_can_download_and_delete_backup(): void
    {
        $admin = $this->createAdmin();
        $backupName = config('backup.backup.name', 'masarat-wasel');
        $diskName = config('backup.backup.destination.disks.0', 'local');

        Storage::fake($diskName);

        // Put fake backup zip
        $fakeZipContent = 'PK...fake zip content';
        Storage::disk($diskName)->put("{$backupName}/test_backup_2026.zip", $fakeZipContent);

        // Download
        $downloadResponse = $this->actingAs($admin)->get(route('admin.backups.download', 'test_backup_2026.zip'));
        $downloadResponse->assertOk();

        // Delete
        $deleteResponse = $this->actingAs($admin)->delete(route('admin.backups.destroy', 'test_backup_2026.zip'));
        $deleteResponse->assertRedirect();
        $deleteResponse->assertSessionHas('success');

        Storage::disk($diskName)->assertMissing("{$backupName}/test_backup_2026.zip");
    }
}
