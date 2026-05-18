<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'school_id',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }

    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function getNameAttribute($value): string
    {
        $isEn = (request()->header('Accept-Language') === 'en' 
            || request()->input('lang') === 'en' 
            || (auth()->check() && auth()->user()->preferred_language === 'en'));

        if ($isEn) {
            $map = [
                'الصف الأول'  => 'First Grade',
                'الصف الثاني' => 'Second Grade',
                'الصف الثالث' => 'Third Grade',
                'أول ثانوي'   => 'First Secondary',
                'ثاني ثانوي'  => 'Second Secondary',
                'ثالث ثانوي'  => 'Third Secondary',
                'الروضة'      => 'Kindergarten',
                'الابتدائي'   => 'Primary',
                'المتوسط'     => 'Intermediate',
                'غير محدد'    => 'Undetermined',
            ];
            $trimmed = trim($value);
            return $map[$trimmed] ?? $value;
        }

        return $value ?? '';
    }
}
