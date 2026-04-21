<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends Model
{
    use HasFactory;

    // ⬅️ أضف الحقول الجديدة هنا
    protected $fillable = [
        'first_name_ar',
        'second_name_ar',
        'third_name_ar',
        'last_name_ar',
        'first_name_en',
        'second_name_en',
        'third_name_en',
        'last_name_en',
        'student_code',
        'national_id',
        'gender',
        'image',
        'is_active',
        'forth_bus_id',
        'back_bus_id',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['full_name', 'full_name_en'];

    /**
     * Get the student's full name (Arabic preferred).
     */
    public function getFullNameAttribute(): string
    {
        return $this->full_name_ar;
    }

    /**
     * Get the student's full name in Arabic.
     */
    public function getFullNameArAttribute(): string
    {
        $names = [
            $this->first_name_ar,
            $this->second_name_ar,
            $this->third_name_ar,
            $this->last_name_ar
        ];

        // Ensure each part is UTF-8 or empty
        $names = array_map(function($n) {
            return is_string($n) ? mb_convert_encoding($n, 'UTF-8', 'UTF-8') : null;
        }, $names);

        $fullName = trim(implode(' ', array_filter($names)));

        return $fullName ?: ($this->student_code ?? '');
    }

    /**
     * Get the student's full name in English.
     */
    public function getFullNameEnAttribute(): string
    {
        $namesEn = [
            $this->first_name_en,
            $this->second_name_en,
            $this->third_name_en,
            $this->last_name_en
        ];
        
        $namesEn = array_map(function($n) {
            return is_string($n) ? mb_convert_encoding($n, 'UTF-8', 'UTF-8') : null;
        }, $namesEn);

        $fullNameEn = trim(implode(' ', array_filter($namesEn)));

        return $fullNameEn ?: ($this->student_code ?? '');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentSchoolEnrollment::class);
    }

    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(StudentSchoolEnrollment::class)->where('is_active', true)->latestOfMany();
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'guardian_student', 'student_id', 'guardian_id')
            ->withPivot('relationship_type')
            ->withTimestamps();
    }

    /**
     * Get the primary guardian of the student.
     */
    public function guardian(): BelongsToMany
    {
        return $this->guardians(); // Returns the relationship so it can be used in with('guardian')
    }

    // ⬅️ أضف هذه العلاقة
    /**
     * الحصول على رقم معرف المدرسة برمجياً من خلال الفصل المرتبط به الطالب
     */
    public function getSchoolIdAttribute()
    {
        return $this->currentEnrollment?->classroom?->school_id;
    }

    /**
     * الوصول للمدرسة التي ينتمي إليها الطالب حالياً
     */
    public function school()
    {
        return $this->currentEnrollment?->classroom?->school();
    }


    public function forthBus(): BelongsTo
    {
        return $this->belongsTo(Bus::class, 'forth_bus_id');
    }

    public function backBus(): BelongsTo
    {
        return $this->belongsTo(Bus::class, 'back_bus_id');
    }

    public function tripAttendances(): HasMany
    {
        return $this->hasMany(TripAttendance::class);
    }

    public function trips(): BelongsToMany
    {
        return $this->belongsToMany(Trip::class, 'trip_attendances', 'student_id', 'trip_id')->withTimestamps();
    }

    /**
     * جميع سجلات الركوب/النزول
     */
    public function boardingLogs(): HasMany
    {
        return $this->hasMany(BusBoardingLog::class);
    }

    public function absenceRequests(): HasMany
    {
        return $this->hasMany(AbsenceRequest::class);
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

    /**
     * Scope a query to only include students in a specific school.
     */
    public function scopeInSchool($query, $schoolId)
    {
        return $query->whereHas('enrollments.classroom', function($q) use ($schoolId) {
            $q->where('school_id', $schoolId);
        });
    }
}


