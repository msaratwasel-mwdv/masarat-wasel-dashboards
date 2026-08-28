<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppLog extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_logs';

    protected $fillable = [
        'user_id',
        'recipient_phone',
        'recipient_name',
        'recipient_type',
        'template_name',
        'event_type',
        'parameters',
        'header_image_url',
        'wamid',
        'status',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'parameters' => 'array',
        'sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
