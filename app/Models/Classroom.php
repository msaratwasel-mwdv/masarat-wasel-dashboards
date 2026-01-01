<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\User;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'grade_level',
        'school_id',
    ];

    // ✅ تم الحفاظ على هذه العلاقة المهمة التي كانت في كودك
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * ربط المعلمين بالفصل (Teachers)
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classroom_teacher', 'classroom_id', 'teacher_id')
            ->withTimestamps()
            ->withPivot('school_id');
    }
}
