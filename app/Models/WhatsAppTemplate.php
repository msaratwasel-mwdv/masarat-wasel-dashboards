<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppTemplate extends Model
{
    protected $table = 'whatsapp_templates';

    protected $fillable = [
        'whatsapp_account_id',
        'meta_template_id',
        'name',
        'language',
        'category',
        'status',
        'components',
        'quality_score',
    ];

    protected $casts = [
        'components' => 'array',
    ];

    public function account()
    {
        return $this->belongsTo(WhatsAppAccount::class, 'whatsapp_account_id');
    }

    public function variables()
    {
        return $this->hasMany(WhatsAppTemplateVariable::class, 'whatsapp_template_id');
    }

    public function eventBindings()
    {
        return $this->hasMany(WhatsAppEventBinding::class);
    }
}
