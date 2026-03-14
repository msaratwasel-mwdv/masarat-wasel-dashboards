<?php

namespace App\Models;

class Assistant extends User
{
    protected $table = 'users';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('assistant', function ($builder) {
            $builder->where('role', 'supervisor'); // assuming assistant role is 'supervisor' in DB or needs a new role
        });

        static::creating(function ($assistant) {
            $assistant->role = 'supervisor';
        });
    }
}
