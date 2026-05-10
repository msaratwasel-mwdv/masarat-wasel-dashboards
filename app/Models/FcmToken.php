<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FcmToken extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'device_id',
        'device_type',
        'app_bundle_id',
        'device_name',
        'preferred_language',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
