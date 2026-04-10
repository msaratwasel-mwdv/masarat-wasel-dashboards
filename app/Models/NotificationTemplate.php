<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $fillable = [
        'name_ar',
        'name_en',
        'title_ar',
        'title_en',
        'body_ar',
        'body_en',
        'type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Scope for active templates only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}


