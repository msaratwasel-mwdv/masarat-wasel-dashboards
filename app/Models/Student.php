<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * تنظيف البيانات المرتبطة عند الحذف الناعم (Soft Delete)
     * يُنفَّذ تلقائياً داخل نفس الـ transaction الذي استدعى delete()
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function (Student $student) {
            // استخدام DB مباشرة لتجنب إطلاق model events إضافية (recursive events)
            \Illuminate\Support\Facades\DB::table('students')
                ->where('id', $student->id)
                ->update(['forth_bus_id' => null, 'back_bus_id' => null]);

            // تعطيل التسجيل الأكاديمي — الحفاظ على السجل التاريخي
            $student->enrollments()->update(['is_active' => false]);
        });
    }

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
        'forth_latitude',
        'forth_longitude',
        'back_bus_id',
        'back_latitude',
        'back_longitude',
        'address',
        'latitude',
        'longitude',
        'location_note',
    ];
    
    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::saving(function ($student) {
            // If the primary latitude or longitude is changed, sync to directional fields
            if ($student->isDirty(['latitude', 'longitude'])) {
                $student->forth_latitude = $student->latitude;
                $student->forth_longitude = $student->longitude;
                $student->back_latitude = $student->latitude;
                $student->back_longitude = $student->longitude;
            }
        });
    }


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
        $isEn = (request()->header('Accept-Language') === 'en' 
            || request()->input('lang') === 'en' 
            || (auth()->check() && auth()->user()->preferred_language === 'en'));

        if ($isEn) {
            $nameEn = $this->full_name_en;
            if (!empty(trim($nameEn)) && $nameEn !== $this->student_code) {
                return $nameEn;
            }
        }

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
        return $this->currentEnrollment?->classroom?->grade?->school_id;
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

    public function todayTripAttendances(): HasMany
    {
        return $this->hasMany(TripAttendance::class)
            ->whereHas('trip', function ($q) {
                $q->whereDate('trip_date', today());
            });
    }

    public function trips(): BelongsToMany
    {
        return $this->belongsToMany(Trip::class, 'trip_attendances', 'student_id', 'trip_id')->withTimestamps();
    }

    public function absenceRequests(): HasMany
    {
        return $this->hasMany(AbsenceRequest::class);
    }

    /**
     * آخر سجل تحضير في رحلات اليوم (المرتب حسب تاريخ التحديث أولاً ثم المعرف)
     */
    public function lastTripAttendance(): HasOne
    {
        return $this->hasOne(TripAttendance::class)
            ->ofMany([
                'updated_at' => 'max',
                'id' => 'max',
            ], function ($relation) {
                $relation->whereHas('trip', fn($q) => $q->whereDate('trip_date', today()));
            });
    }

    /**
     * طلبات تحديد الموقع الخاصة بالطالب
     */
    public function locationRequests(): HasMany
    {
        return $this->hasMany(StudentLocationRequest::class, 'student_id');
    }

    /**
     * Scope a query to only include students in a specific school.
     */
    public function scopeInSchool($query, $schoolId)
    {
        return $query->whereHas('enrollments.classroom', function($q) use ($schoolId) {
            $q->atSchool($schoolId);
        });
    }
}


