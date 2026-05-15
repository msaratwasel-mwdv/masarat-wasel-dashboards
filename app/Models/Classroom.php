<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Models\Student;
use App\Models\StudentSchoolEnrollment;
use App\Models\Grade;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Attendance;
use App\Models\School;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'grade_id',
    ];

    public function school(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            School::class,
            Grade::class,
            'id',       // Foreign key on grades table
            'id',       // Foreign key on schools table
            'grade_id', // Local key on classrooms table
            'school_id' // Local key on grades table
        );
    }

    public function scopeAtSchool($query, $schoolId)
    {
        return $query->whereIn('grade_id', function ($q) use ($schoolId) {
            $q->select('id')->from('grades')->where('school_id', $schoolId);
        });
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


