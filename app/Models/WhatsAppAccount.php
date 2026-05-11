<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class WhatsAppAccount extends Model
{
    protected $table = 'whatsapp_accounts';

    protected $fillable = [
        'waba_id',
        'phone_number_id',
        'display_phone',
        'access_token',
        'webhook_verify_token',
        'app_secret',
        'status',
        'messaging_tier',
    ];

    /**
     * Encrypt access token when saving.
     */
    public function setAccessTokenAttribute($value)
    {
        $this->attributes['access_token'] = Crypt::encryptString($value);
    }

    /**
     * Decrypt access token when retrieving.
     */
    public function getAccessTokenAttribute($value)
    {
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function templates()
    {
        return $this->hasMany(WhatsAppTemplate::class);
    }

    public function messages()
    {
        return $this->hasMany(WhatsAppMessage::class);
    }
}
