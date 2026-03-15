<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionResult extends Model
{
    protected $fillable = [
        'inspection_id',
        'item_id',
        'is_passed',
        'notes'
    ];

    protected $casts = [
        'is_passed' => 'boolean',
    ];

    public function item()
    {
        return $this->belongsTo(InspectionItem::class, 'item_id');
    }
}
