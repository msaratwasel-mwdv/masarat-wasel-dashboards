<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'grade_level',
        'school_id',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    // ✅ العلاقة الصحيحة
    public function supervisors(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'classroom_teacher',
            'classroom_id',
            'teacher_id'
        )->withPivot('school_id')
         ->withTimestamps();
    }

    /**
     * Alias for supervisors relationship to support controller usage of 'teachers'
     */
    public function teachers(): BelongsToMany
    {
        return $this->supervisors();
    }

    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            StudentSchoolEnrollment::class,
            'classroom_id',
            'id',
            'id',
            'student_id'
        )->where('student_school_enrollments.is_active', true);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
