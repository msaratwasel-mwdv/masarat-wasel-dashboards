<?php

namespace App\Models;

class Guardian extends User
{
    protected $table = 'users';

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('guardian', function ($builder) {
            $builder->whereIn('role', ['guardian', 'parent']);
        });

        static::creating(function ($guardian) {
            $guardian->role = 'guardian';
        });
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'guardian_id');
    }
}
