<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Student;
use Illuminate\Support\Facades\Storage;

class FixImagePaths extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:fix-images';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up broken image paths in the database to prevent 403/404 errors in the app';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting image cleanup...');
        
        // 1. Clean Users (Drivers, Supervisors, Parents, etc.)
        $users = User::whereNotNull('image')->get();
        $this->info("Found {$users->count()} users with images.");
        
        $fixedUsers = 0;
        foreach ($users as $user) {
            $imagePath = $user->image;
            
            // If image is '0', 'null', or empty
            if (empty($imagePath) || $imagePath === '0' || $imagePath === 'null') {
                $user->update(['image' => null]);
                $fixedUsers++;
                continue;
            }

            // Exclude external URLs
            if (str_starts_with($imagePath, 'http')) {
                continue;
            }

            // If file does not exist on disk
            if (!Storage::disk('public')->exists($imagePath)) {
                $user->update(['image' => null]);
                $fixedUsers++;
            }
        }
        
        $this->info("Fixed {$fixedUsers} broken user images.");

        // 2. Clean Students
        $students = Student::whereNotNull('image')->get();
        $this->info("Found {$students->count()} students with images.");
        
        $fixedStudents = 0;
        foreach ($students as $student) {
            $imagePath = $student->image;
            
            if (empty($imagePath) || $imagePath === '0' || $imagePath === 'null') {
                $student->update(['image' => null]);
                $fixedStudents++;
                continue;
            }

            if (str_starts_with($imagePath, 'http')) {
                continue;
            }

            if (!Storage::disk('public')->exists($imagePath)) {
                $student->update(['image' => null]);
                $fixedStudents++;
            }
        }

        $this->info("Fixed {$fixedStudents} broken student images.");

        $this->info('Done! Broken image references have been nullified.');
    }
}
