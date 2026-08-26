<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestTrackingSeeder extends Seeder
{
    public function run()
    {
        // 1. Create or Update School "Al-Ufuq International School"
        $school = School::updateOrCreate(
            ['name' => 'مدرسة الأفق العالمية'],
            [
                'address' => 'فرع العدين، إب - بجوار الباص',
                'latitude' => 13.9307 + 0.01, // ~1km away
                'longitude' => 43.7773 + 0.01,
                'status' => 'Active',
            ]
        );

        // 1.1 Create a Route (Line)
        $route = \App\Models\Route::updateOrCreate(
            ['code' => 'R_UDAYN_01', 'school_id' => $school->id],
            [
                'name' => 'خط فرع العدين الرئيسي',
                'description' => 'الخط المغذي لمنطقة فرع العدين وحي المركز',
            ]
        );

        // 1.2 Create Academic Calendar (REQUIRED for Trip Generation)
        \App\Models\AcademicCalendar::updateOrCreate(
            ['school_id' => $school->id, 'is_active' => true],
            [
                'name' => 'الفصل الدراسي الأول - فرع العدين',
                'start_date' => now()->subMonths(1),
                'end_date' => now()->addMonths(6),
                'working_days' => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'], // All days for testing
            ]
        );

        // 2. Find or Create Bus B_200
        $bus = Bus::updateOrCreate(
            ['bus_number' => 'B_200'],
            [
                'plate_number' => 'B-200-YEM',
                'capacity' => 30,
                'model' => 'Mercedes Sprinter',
                'year' => 2024,
                'school_id' => $school->id,
                'route_id' => $route->id,
                'status' => 'active',
                'latitude' => 13.9307,
                'longitude' => 43.7773,
            ]
        );

        // 2.1 Create Driver for this bus
        User::where('phone', '771111111')->orWhere('national_id', '1002003001')->delete();
        $driverRole = Role::firstOrCreate(['name' => 'driver'], ['display_name' => 'سائق']);
        $driverUser = User::create([
            'phone' => '771111111',
            'first_name_ar' => 'سائق',
            'last_name_ar' => '200',
            'first_name_en' => 'Driver',
            'last_name_en' => '200',
            'email' => 'driver200@masarat.com',
            'password' => Hash::make('password'),
            'national_id' => '1002003001',
        ]);
        $driverUser->roles()->syncWithoutDetaching([$driverRole->id]);
        
        DB::table('drivers')->updateOrInsert(
            ['user_id' => $driverUser->id],
            [
                'license_number' => 'L-200',
                'license_expiry_date' => now()->addYears(5),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $bus->update(['driver_id' => $driverUser->id]);

        // 2.2 Create Assistant for this bus
        User::where('phone', '772222222')->orWhere('national_id', '1002003002')->delete();
        $assistantRole = Role::firstOrCreate(['name' => 'assistant'], ['display_name' => 'مشرفة']);
        $assistantUser = User::create([
            'phone' => '772222222',
            'first_name_ar' => 'مشرفة',
            'last_name_ar' => '200',
            'first_name_en' => 'Assistant',
            'last_name_en' => '200',
            'email' => 'assistant200@masarat.com',
            'password' => Hash::make('password'),
            'national_id' => '1002003002',
        ]);
        $assistantUser->roles()->syncWithoutDetaching([$assistantRole->id]);

        DB::table('assistants')->updateOrInsert(
            ['user_id' => $assistantUser->id],
            [
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $bus->update(['assistant_id' => $assistantUser->id]);

        // 3. Clear existing students from this bus
        Student::where('forth_bus_id', $bus->id)->update(['forth_bus_id' => null]);
        Student::where('back_bus_id', $bus->id)->update(['back_bus_id' => null]);

        // 4. Roles
        $parentRole = Role::firstOrCreate(['name' => 'parent'], ['display_name' => 'ولي أمر']);

        // 5. Locations in Far' Al-Udayn (Adjusted to be near the driver's current reported location)
        $centerLat = 13.9307;
        $centerLng = 43.7773;

        $locations = [
            ['lat' => $centerLat + 0.001, 'lng' => $centerLng + 0.001, 'address' => 'بجوار الباص - النقطة 1'],
            ['lat' => $centerLat + 0.003, 'lng' => $centerLng + 0.002, 'address' => 'بجوار الباص - النقطة 2'],
            ['lat' => $centerLat - 0.002, 'lng' => $centerLng + 0.003, 'address' => 'بجوار الباص - النقطة 3'],
            ['lat' => $centerLat + 0.005, 'lng' => $centerLng - 0.001, 'address' => 'بجوار الباص - النقطة 4'],
            ['lat' => $centerLat - 0.004, 'lng' => $centerLng - 0.002, 'address' => 'بجوار الباص - النقطة 5'],
        ];

        $classroom = DB::table('classrooms')->where('school_id', $school->id)->first();
        if (!$classroom) {
            $classroomId = DB::table('classrooms')->insertGetId([
                'name' => 'فصل تجريبي',
                'school_id' => $school->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $classroomId = $classroom->id;
        }

        for ($i = 1; $i <= 5; $i++) {
            $loc = $locations[$i - 1];
            $phone = '77990000' . $i;
            
            // Re-create parent to ensure clean IDs
            User::where('phone', $phone)->delete();
            User::where('email', 'test_parent' . $i . '@masarat.com')->delete();

            $parent = User::create([
                'first_name_ar' => 'ولي أمر',
                'last_name_ar' => (string)$i,
                'first_name_en' => 'Parent',
                'last_name_en' => (string)$i,
                'phone' => $phone,
                'national_id' => '200300400' . $i,
                'email' => 'test_parent' . $i . '@masarat.com',
                'password' => Hash::make('password'),
                'address' => $loc['address'],
                'latitude' => $loc['lat'],
                'longitude' => $loc['lng'],
            ]);

            $parent->roles()->syncWithoutDetaching([$parentRole->id]);

            if (\Schema::hasTable('guardians')) {
                DB::table('guardians')->updateOrInsert(
                    ['user_id' => $parent->id],
                    ['status' => 'active']
                );
            }

            for ($j = 1; $j <= 3; $j++) {
                $student = Student::create([
                    'first_name_ar' => 'طالب ' . $j,
                    'last_name_ar' => 'الأفق',
                    'first_name_en' => 'Student ' . $j,
                    'last_name_en' => 'Al-Ufuq',
                    'student_code' => 'ALU-' . $i . '-' . $j . '-' . rand(100, 999),
                    'national_id' => '300400500' . $i . $j,
                    'gender' => ($j % 2 == 0) ? 'female' : 'male',
                    'is_active' => true,
                    'forth_bus_id' => $bus->id,
                    'back_bus_id' => $bus->id,
                    'forth_latitude' => $loc['lat'] + (rand(-8, 8) / 10000),
                    'forth_longitude' => $loc['lng'] + (rand(-8, 8) / 10000),
                    'back_latitude' => $loc['lat'] + (rand(-8, 8) / 10000),
                    'back_longitude' => $loc['lng'] + (rand(-8, 8) / 10000),
                    'latitude' => $loc['lat'],
                    'longitude' => $loc['lng'],
                    'address' => $loc['address'],
                ]);

                $parent->students()->attach($student->id, ['relationship_type' => 'father']);
                
                DB::table('student_school_enrollments')->insert([
                    'student_id' => $student->id,
                    'classroom_id' => $classroomId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 14. Generate Trips for TODAY (Forth only)
        $tripService = app(\App\Services\TripService::class);
        $tripService->autoCreateDailyTrips(now());

        // Delete back trips to keep only Forth trip as requested
        \App\Models\Trip::whereDate('trip_date', today())
            ->where('bus_id', $bus->id)
            ->where('type', 'back')
            ->delete();

        $this->command->info('TestTrackingSeeder: Far\' Al-Udayn environment setup complete with Morning (Forth) trip only!');
    }
}
