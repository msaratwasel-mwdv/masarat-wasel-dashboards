<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Incident extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reporter_id',
        'bus_id',
        'trip_id',
        'type',
        'severity',
        'description',
        'location_lat',
        'location_lng',
        'status',
        'resolved_by',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function bus()
    {
        return $this->belongsTo(Bus::class);
    }

    public function trip()
    {
        return $this->belongsTo(FieldTrip::class, 'trip_id');
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
