<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppMessage extends Model
{
    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'whatsapp_account_id',
        'whatsapp_template_id',
        'meta_message_id',
        'recipient_phone',
        'recipient_user_id',
        'direction',
        'status',
        'template_variables_snapshot',
        'error_payload',
        'sent_at',
        'delivered_at',
        'read_at',
    ];

    protected $casts = [
        'template_variables_snapshot' => 'array',
        'error_payload' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(WhatsAppAccount::class, 'whatsapp_account_id');
    }

    public function template()
    {
        return $this->belongsTo(WhatsAppTemplate::class);
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
