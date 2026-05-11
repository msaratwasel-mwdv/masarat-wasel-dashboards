<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppEventBinding extends Model
{
    protected $table = 'whatsapp_event_bindings';

    protected $fillable = [
        'whatsapp_template_id',
        'event_name',
        'target_role',
        'recipient_resolver',
        'is_active',
        'conditions',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'conditions' => 'array',
    ];

    public function template()
    {
        return $this->belongsTo(WhatsAppTemplate::class);
    }
}
