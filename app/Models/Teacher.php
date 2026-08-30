<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Teacher extends Model
{
    protected $table = 'teachers';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'school_id',
        'grade_id',
        'status',
        'fcm_token',
    ];

    // protected $appends = ['name'];

    public function getNameAttribute()
    {
        return $this->user ? $this->user->name : '';
    }

    public function getNameEnAttribute()
    {
        return $this->user ? $this->user->name_en : '';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function school(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            School::class,
            Grade::class,
            'id',       // Foreign key on grades table
            'id',       // Foreign key on schools table
            'grade_id', // Local key on teachers table
            'school_id' // Local key on grades table
        );
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }
}
