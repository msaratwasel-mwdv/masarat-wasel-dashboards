<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppTemplateVariable extends Model
{
    protected $table = 'whatsapp_template_variables';

    protected $fillable = [
        'whatsapp_template_id',
        'position',
        'component_type',
        'source_model',
        'source_attribute',
        'fallback_value',
    ];

    public function template()
    {
        return $this->belongsTo(WhatsAppTemplate::class);
    }
}
