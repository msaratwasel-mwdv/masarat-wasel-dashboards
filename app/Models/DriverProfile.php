<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    protected $fillable = [
        'user_id',
        'license_number',
        'license_expiry_date',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
