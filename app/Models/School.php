<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'status',
        'has_transport',
        'has_attendance',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
