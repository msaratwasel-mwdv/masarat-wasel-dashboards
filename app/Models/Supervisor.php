<?php

namespace App\Models;

class Supervisor extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('supervisor', function ($builder) {
            $builder->where('role', 'supervisor');
        });

        static::creating(function ($supervisor) {
            $supervisor->role = 'supervisor';
        });
    }
}
