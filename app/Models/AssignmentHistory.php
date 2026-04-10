<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssignmentHistory extends Model
{
    // 1. السماح بتعبئة هذه الحقول (Mass Assignment)
    protected $fillable = [
        'bus_id',
        'event_type',
        'old_driver_id',
        'new_driver_id',
        'old_supervisor_id',
        'new_supervisor_id',
        'old_school_id',
        'new_school_id',
        'old_status',      // الحالة القديمة
        'new_status',      // الحالة الجديدة
        'notes',           // الملاحظات أو سبب الأرشفة
        'changed_by',      // من قام بالتعديل
    ];

    // --- 2. العلاقات (مهمة جداً لعرض التقرير) ---

    // الباص المعني
    public function bus()
    {
        return $this->belongsTo(Bus::class)->withTrashed();
    }

    // الأدمن الذي قام بالتغيير
    public function admin()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    // --- علاقات السائقين ---
    public function oldDriver()
    {
        return $this->belongsTo(User::class, 'old_driver_id');
    }

    public function newDriver()
    {
        return $this->belongsTo(User::class, 'new_driver_id');
    }

    // --- علاقات المشرفين ---
    public function oldSupervisor()
    {
        return $this->belongsTo(User::class, 'old_supervisor_id');
    }

    public function newSupervisor()
    {
        return $this->belongsTo(User::class, 'new_supervisor_id');
    }

    // --- علاقات المدارس ---
    public function oldSchool()
    {
        return $this->belongsTo(School::class, 'old_school_id');
    }

    public function newSchool()
    {
        return $this->belongsTo(School::class, 'new_school_id');
    }
}


