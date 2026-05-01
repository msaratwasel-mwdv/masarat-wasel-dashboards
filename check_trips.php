<?php
$trips = \App\Models\Trip::all()->map(function($t) {
    return [
        'id' => $t->id,
        'school_id' => $t->school_id,
        'bus_id' => $t->bus_id,
        'date' => $t->trip_date->toDateString(),
        'type' => $t->type
    ];
});

echo "Trips in DB: " . json_encode($trips) . "\n";
