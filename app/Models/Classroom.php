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

    // ✅ العلاقة الجديدة لجلب قائمة المعلمين (Extension records)
    public function teachers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Teacher::class, 'classroom_id');
    }

    // ✅ العلاقة الصحيحة (1:1 direct to user)
    public function teacher(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            Teacher::class,
            'classroom_id', // Foreign key on teachers table
            'id',           // Foreign key on users table
            'id',           // Local key on classrooms table
            'user_id'       // Local key on teachers table
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


