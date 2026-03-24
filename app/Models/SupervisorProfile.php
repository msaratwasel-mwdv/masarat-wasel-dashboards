<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'emergency_contact_name',
        'emergency_contact_phone',
        'status',
        'supervisor_type',
        'tracking_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
