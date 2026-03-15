<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'inspection_item_id',
        'is_passed',
        'notes',
    ];

    protected $casts = [
        'is_passed' => 'boolean',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function item()
    {
        return $this->belongsTo(InspectionItem::class, 'inspection_item_id');
    }
}
