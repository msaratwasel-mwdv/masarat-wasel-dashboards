<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends User
{
    protected $table = 'users';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('student', function ($builder) {
            $builder->where('role', 'student');
        });

        static::creating(function ($student) {
            $student->role = 'student';
            if (empty($student->name) && !empty($student->full_name)) {
                $student->name = $student->full_name;
            }
        });

    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentSchoolEnrollment::class);
    }

    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(StudentSchoolEnrollment::class)->where('is_active', true)->latestOfMany();
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guardian_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    // ⬅️ أضف هذه العلاقة
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Get the buses this student is assigned to.
     */
    public function buses(): BelongsToMany
    {
        return $this->belongsToMany(Bus::class, 'bus_students')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function morningGroup(): BelongsTo
    {
        return $this->belongsTo(BusGroup::class, 'morning_group_id');
    }

    public function afternoonGroup(): BelongsTo
    {
        return $this->belongsTo(BusGroup::class, 'afternoon_group_id');
    }

    public function forthRoute(): BelongsTo
    {
        return $this->belongsTo(Route::class, 'forth_route_id');
    }

    public function backRoute(): BelongsTo
    {
        return $this->belongsTo(Route::class, 'back_route_id');
    }

    public function tripAttendances(): HasMany
    {
        return $this->hasMany(TripAttendance::class);
    }

    public function trips(): BelongsToMany
    {
        return $this->belongsToMany(Trip::class, 'trip_students', 'student_id', 'trip_id')->withTimestamps();
    }

    /**
     * جميع سجلات الركوب/النزول
     */
    public function boardingLogs(): HasMany
    {
        return $this->hasMany(BusBoardingLog::class);
    }

    /**
     * آخر سجل ركوب/نزول اليوم — يستخدم لتحديد حالة الطالب الحالية
     */
    public function lastBusLog(): HasOne
    {
        return $this->hasOne(BusBoardingLog::class)
            ->where('created_at', '>=', now()->startOfDay())
            ->latest();
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
