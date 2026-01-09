<?php

namespace Database\Seeders;

use App\Models\Bus;
use App\Models\BusRequest;
use App\Models\TripSchedule;
use App\Models\FieldTrip;
use App\Models\FieldTripParticipant;
use App\Models\School;
use Illuminate\Database\Seeder;

class BusSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        
        if (!$school) {
            $this->command->error('No schools found. Please run DatabaseSeeder first.');
            return;
        }

        // Create 5 Buses
        $buses = [
            ['bus_number' => 'BUS-001', 'plate_number' => 'ABC-1234', 'capacity' => 30, 'type' => 'permanent', 'status' => 'active'],
            ['bus_number' => 'BUS-002', 'plate_number' => 'DEF-5678', 'capacity' => 25, 'type' => 'permanent', 'status' => 'active'],
            ['bus_number' => 'BUS-003', 'plate_number' => 'GHI-9012', 'capacity' => 35, 'type' => 'permanent', 'status' => 'maintenance'],
            ['bus_number' => 'BUS-004', 'plate_number' => 'JKL-3456', 'capacity' => 28, 'type' => 'temporary', 'status' => 'active'],
            ['bus_number' => 'BUS-005', 'plate_number' => 'MNO-7890', 'capacity' => 32, 'type' => 'permanent', 'status' => 'inactive'],
        ];

        $createdBuses = [];
        foreach ($buses as $busData) {
            $createdBuses[] = Bus::create(array_merge($busData, ['school_id' => $school->id]));
        }

        // Create 3 Bus Requests
        BusRequest::create([
            'school_id' => $school->id,
            'request_type' => 'permanent',
            'number_of_buses' => 2,
            'start_date' => now()->addDays(7),
            'end_date' => null,
            'reason' => 'نحتاج حافلات إضافية بسبب زيادة عدد الطلاب',
            'special_requirements' => 'يفضل أن تكون مكيفة',
            'status' => 'pending',
        ]);

        BusRequest::create([
            'school_id' => $school->id,
            'request_type' => 'temporary',
            'number_of_buses' => 1,
            'start_date' => now()->addDays(14),
            'end_date' => now()->addDays(21),
            'reason' => 'رحلة ميدانية للطلاب',
            'status' => 'approved',
            'approved_at' => now()->subDays(2),
        ]);

        BusRequest::create([
            'school_id' => $school->id,
            'request_type' => 'field_trip',
            'number_of_buses' => 3,
            'start_date' => now()->addMonths(1),
            'end_date' => now()->addMonths(1)->addDays(1),
            'reason' => 'رحلة تعليمية إلى المتحف الوطني',
            'status' => 'rejected',
            'approved_at' => now()->subDays(1),
        ]);

        // Create Trip Schedules for active buses (Sunday to Thursday)
        foreach ($createdBuses as $index => $bus) {
            if ($bus->status === 'active') {
                for ($day = 0; $day <= 4; $day++) { // 0=Sunday to 4=Thursday
                    TripSchedule::create([
                        'bus_id' => $bus->id,
                        'school_id' => $school->id,
                        'day_of_week' => $day,
                        'gathering_time' => '06:' . str_pad(($index * 10), 2, '0', STR_PAD_LEFT), // 06:00, 06:10, 06:20
                        'departure_time' => '07:00',
                        'return_time' => '14:00',
                        'last_dropoff_time' => '15:' . str_pad(($index * 10), 2, '0', STR_PAD_LEFT),
                    ]);
                }
            }
        }

        // Create 3 Field Trips
        $fieldTrips = [
            [
                'trip_name' => 'رحلة إلى المتحف الوطني',
                'description' => 'رحلة تعليمية لاستكشاف التاريخ والتراث الوطني',
                'trip_date' => now()->addDays(15),
                'trip_time' => '08:00',
                'destination' => 'المتحف الوطني - الرياض',
                'destination_lat' => 24.6486,
                'destination_lng' => 46.7158,
                'number_of_students' => 60,
                'status' => 'planned',
                'approved_by_school' => false,
                'approved_by_company' => false,
            ],
            [
                'trip_name' => 'زيارة حديقة الحيوان',
                'description' => 'رحلة ترفيهية تعليمية لمشاهدة الحيوانات',
                'trip_date' => now()->addDays(30),
                'trip_time' => '09:00',
                'destination' => 'حديقة الحيوان - الرياض',
                'destination_lat' => 24.7136,
                'destination_lng' => 46.6753,
                'number_of_students' => 45,
                'status' => 'approved',
                'approved_by_school' => true,
                'approved_by_company' => true,
            ],
            [
                'trip_name' => 'رحلة إلى مركز العلوم',
                'description' => 'استكشاف التكنولوجيا والعلوم الحديثة',
                'trip_date' => now()->addDays(45),
                'trip_time' => '08:30',
                'destination' => 'مركز العلوم والتكنولوجيا',
                'destination_lat' => 24.7242,
                'destination_lng' => 46.6344,
                'number_of_students' => 50,
                'status' => 'in_progress',
                'approved_by_school' => true,
                'approved_by_company' => false,
            ],
        ];

        foreach ($fieldTrips as $tripData) {
            $trip = FieldTrip::create(array_merge($tripData, ['school_id' => $school->id]));
            
            // Assign 2 buses to each trip
            $activeBuses = collect($createdBuses)->where('status', 'active')->take(2);
            foreach ($activeBuses as $bus) {
                FieldTripParticipant::create([
                    'field_trip_id' => $trip->id,
                    'participant_type' => 'App\Models\Bus',
                    'participant_id' => $bus->id,
                ]);
            }
        }

        $this->command->info('✅ Bus data seeded successfully!');
        $this->command->info('   - 5 Buses created');
        $this->command->info('   - 3 Bus Requests created');
        $this->command->info('   - ' . (TripSchedule::count()) . ' Trip Schedules created');
        $this->command->info('   - 3 Field Trips created');
    }
}
