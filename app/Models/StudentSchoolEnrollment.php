<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSchoolEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'classroom_id',
        'status',
        'is_active',
    ];

    /**
     * الوصول للمدرسة التي ينتمي إليها الطالب عبر الفصل
     */
    public function school()
    {
        return $this->classroom ? $this->classroom->school() : null;
    }

    public function getSchoolAttribute()
    {
        return $this->classroom ? $this->classroom->school : null;
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
