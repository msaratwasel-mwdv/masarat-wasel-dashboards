<?php
$bus = \App\Models\Bus::first();
if(!$bus) { echo "No bus\n"; exit; }
$school = \App\Models\School::find($bus->school_id);
$students = \App\Models\Student::where('forth_bus_id', $bus->id)->orWhere('back_bus_id', $bus->id)->take(3)->get();
if($students->isEmpty()) {
    $students = \App\Models\Student::take(3)->get();
}

$dates = [
    \Carbon\Carbon::today(),
    \Carbon\Carbon::tomorrow(),
    \Carbon\Carbon::yesterday()
];

foreach ($dates as $day) {
    // Clear existing dummy trips for this date
    \App\Models\Trip::where('school_id', $school->id)->whereDate('trip_date', $day->toDateString())->delete();

    // Create Morning Trip
    $morningTrip = \App\Models\Trip::create([
        'school_id' => $school->id,
        'bus_id' => $bus->id,
        'driver_id' => $bus->driver_id,
        'route_id' => $bus->route_id,
        'trip_date' => $day->toDateString(),
        'type' => 'forth', // الذهاب
        'status' => 'finished',
        'departure_time' => $day->copy()->setHour(6)->setMinute(30),
        'arrival_time' => $day->copy()->setHour(7)->setMinute(15),
    ]);

    // Create Evening Trip
    $eveningTrip = \App\Models\Trip::create([
        'school_id' => $school->id,
        'bus_id' => $bus->id,
        'driver_id' => $bus->driver_id,
        'route_id' => $bus->route_id,
        'trip_date' => $day->toDateString(),
        'type' => 'back', // العودة
        'status' => 'finished',
        'departure_time' => $day->copy()->setHour(13)->setMinute(30),
        'arrival_time' => $day->copy()->setHour(14)->setMinute(15),
    ]);

    foreach($students as $index => $student) {
        // Morning Attendance
        \App\Models\TripAttendance::create([
            'trip_id' => $morningTrip->id,
            'student_id' => $student->id,
            'check_in_time' => $day->copy()->setHour(6)->setMinute(45 + $index),
            'check_out_time' => $day->copy()->setHour(7)->setMinute(15),
            'status' => 'dropped',
        ]);

        // Evening Attendance
        \App\Models\TripAttendance::create([
            'trip_id' => $eveningTrip->id,
            'student_id' => $student->id,
            'check_in_time' => $day->copy()->setHour(13)->setMinute(30),
            'check_out_time' => $day->copy()->setHour(14)->setMinute(0 + $index),
            'status' => 'dropped',
        ]);
    }
}

echo "Dummy trips created successfully for yesterday, today, and tomorrow!\n";
