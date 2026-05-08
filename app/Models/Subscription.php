<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'school_id',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }


    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'trialing']);
    }

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function isPendingApproval()
    {
        return $this->status === 'pending_approval';
    }
}