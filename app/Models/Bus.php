<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bus extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'bus_code',
        'plate_number',
        'capacity',
        'model',
        'year',
        'school_id',
        'driver_id',
        'supervisor_id',
        'status',
        'qr_code_path',
    ];

    // --- Relationships ---

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    // --- Helper Methods ---

    /**
     * توليد كود الباص تلقائياً
     * Example: BUS-001
     */
    public static function generateNextCode()
    {
        // نأخذ آخر باص تم إنشاؤه (حتى لو كان محذوفاً)
        $lastBus = self::withTrashed()->latest('id')->first();

        // إذا وجدنا باص، نزيد 1 على رقمه، وإلا نبدأ بـ 1
        $nextId = $lastBus ? ($lastBus->id + 1) : 1;

        // تنسيق الرقم ليصبح 3 خانات (001)
        return 'BUS-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);
    }
}
