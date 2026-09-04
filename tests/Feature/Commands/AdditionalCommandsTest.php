<?php

namespace Tests\Feature\Commands;

use App\Models\Bus;
use App\Models\School;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Traits\CreatesSchoolData;
use Tests\Traits\CreatesTransportData;
use Tests\Traits\CreatesUsers;

class AdditionalCommandsTest extends TestCase
{
    use CreatesSchoolData, CreatesTransportData, CreatesUsers;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_cleanup_trip_videos_deletes_videos_older_than_30_days(): void
    {
        $school = School::factory()->create();
        $bus = Bus::factory()->create(['school_id' => $school->id]);

        // Old trip with video
        $oldVideoPath = 'trips/videos/old_video.mp4';
        Storage::disk('public')->put($oldVideoPath, 'dummy video content');

        $oldTrip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'trip_date' => now()->subDays(35)->toDateString(),
            'video_path' => $oldVideoPath,
            'created_at' => now()->subDays(35),
        ]);

        // Recent trip with video (should NOT be deleted)
        $recentVideoPath = 'trips/videos/recent_video.mp4';
        Storage::disk('public')->put($recentVideoPath, 'recent dummy video content');

        $recentTrip = Trip::factory()->create([
            'school_id' => $school->id,
            'bus_id' => $bus->id,
            'trip_date' => now()->subDays(5)->toDateString(),
            'video_path' => $recentVideoPath,
            'created_at' => now()->subDays(5),
        ]);

        $this->artisan('trips:cleanup-videos')
            ->expectsOutputToContain('Deleted 1 verification videos older than 30 days.')
            ->assertExitCode(0);

        $oldTrip->refresh();
        $recentTrip->refresh();

        $this->assertNull($oldTrip->video_path);
        Storage::disk('public')->assertMissing($oldVideoPath);

        $this->assertEquals($recentVideoPath, $recentTrip->video_path);
        Storage::disk('public')->assertExists($recentVideoPath);
    }

    public function test_fix_images_cleans_broken_image_paths(): void
    {
        // User with non-existent local image
        $userWithBrokenImg = User::factory()->create([
            'image' => 'avatars/missing_avatar.jpg',
        ]);

        // User with valid image on disk
        $validImgPath = 'avatars/existing_avatar.jpg';
        Storage::disk('public')->put($validImgPath, 'fake-image');
        $userWithValidImg = User::factory()->create([
            'image' => $validImgPath,
        ]);

        // User with external URL (should remain untouched)
        $userWithExternalUrl = User::factory()->create([
            'image' => 'https://example.com/photo.png',
        ]);

        $this->artisan('db:fix-images')
            ->expectsOutputToContain('Broken image references have been nullified')
            ->assertExitCode(0);

        $userWithBrokenImg->refresh();
        $userWithValidImg->refresh();
        $userWithExternalUrl->refresh();

        $this->assertNull($userWithBrokenImg->image);
        $this->assertEquals($validImgPath, $userWithValidImg->image);
        $this->assertEquals('https://example.com/photo.png', $userWithExternalUrl->image);
    }
}
