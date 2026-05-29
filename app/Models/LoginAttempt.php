<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginAttempt extends Model
{
    protected $fillable = [
        'user_id',
        'device_name',
        'device_id',
        'device_type',
        'app_context',
        'fcm_token',
        'status',
        'temp_token',
    ];

    /**
     * Get the user that owns the login attempt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
