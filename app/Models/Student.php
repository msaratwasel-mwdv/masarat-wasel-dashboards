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
        'full_name', 
        'student_code', 
        'national_id', // ⬅️ أضف
        'gender',      // ⬅️ أضف
        'guardian_id', 
        'supervisor_id', 
        'school_id',   // ⬅️ أضف
        'image',       // ⬅️ أضف
        'is_active'
    ];

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
}