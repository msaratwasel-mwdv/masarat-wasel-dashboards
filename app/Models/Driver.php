<?php

namespace App\Models;

class Driver extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('driver', function ($builder) {
            $builder->where('role', 'driver');
        });

        static::creating(function ($driver) {
            $driver->role = 'driver';
        });
    }
}
