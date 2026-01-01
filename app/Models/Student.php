<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use HasFactory;

    protected $fillable = ['full_name', 'student_code', 'guardian_id', 'is_active'];

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
        return $this->belongsTo(Guardian::class);
    }


}