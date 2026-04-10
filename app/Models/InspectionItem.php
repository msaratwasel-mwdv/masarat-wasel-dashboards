<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_active',
        'order_index',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order_index' => 'integer',
    ];

    public function results()
    {
        return $this->hasMany(InspectionResult::class);
    }
}


