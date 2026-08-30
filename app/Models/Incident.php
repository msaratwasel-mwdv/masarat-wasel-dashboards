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
        'student_ids',
        'photos',
    ];

    protected $casts = [
        'photos' => 'array',
        'student_ids' => 'array',
        'location_lat' => 'decimal:8',
        'location_lng' => 'decimal:8',
    ];

    protected $appends = ['photo_urls', 'student_names'];

    /**
     * جلب أسماء الطلاب المرتبطين بالبلاغ
     */
    public function getStudentNamesAttribute()
    {
        if (empty($this->student_ids) || ! is_array($this->student_ids)) {
            return [];
        }

        return Student::whereIn('id', $this->student_ids)
            ->get()
            ->pluck('full_name')
            ->toArray();
    }

    public function getPhotoUrlsAttribute()
    {
        $urls = [];
        if (is_array($this->photos)) {
            foreach ($this->photos as $photo) {
                $urls[] = asset('storage/'.$photo);
            }
        }

        return $urls;
    }

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
