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
        'grade_id',
        'school_id',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    // ✅ المعلمين المرتبطين بالمرحلة التي ينتمي إليها هذا الفصل
    public function teachers(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(
            Teacher::class,
            Grade::class,
            'id',       // Foreign key on grades table
            'grade_id', // Foreign key on teachers table
            'grade_id', // Local key on classrooms table
            'id'        // Local key on grades table
        );
    }

    // ✅ المعلم المسؤول عن المرحلة
    public function teacher(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Teacher::class,
            'grade_id', // Foreign key on teachers table
            'id',       // Foreign key on users table
            'grade_id', // Local key on classrooms table
            'user_id'   // Local key on teachers table
        );
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


