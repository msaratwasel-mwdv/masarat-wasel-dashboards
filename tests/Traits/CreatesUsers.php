<?php

namespace Tests\Traits;

use App\Models\Grade;
use App\Models\School;
use App\Models\User;

trait CreatesUsers
{
    /**
     * Create a System Admin user.
     */
    public function createAdmin(array $attributes = []): User
    {
        return User::factory()->admin()->create($attributes);
    }

    /**
     * Create a School Admin user.
     */
    public function createSchoolAdmin(?School $school = null, array $attributes = []): User
    {
        return User::factory()->schoolAdmin($school)->create($attributes);
    }

    /**
     * Create a Driver user.
     */
    public function createDriver(array $attributes = []): User
    {
        return User::factory()->driver()->create($attributes);
    }

    /**
     * Create an Assistant user (مشرفة).
     */
    public function createAssistant(array $attributes = []): User
    {
        return User::factory()->assistant()->create($attributes);
    }

    /**
     * Create a Field Supervisor user (مشرف ميداني).
     */
    public function createFieldSupervisor(array $attributes = []): User
    {
        return User::factory()->fieldSupervisor()->create($attributes);
    }

    /**
     * Create a Teacher user.
     */
    public function createTeacher(?School $school = null, ?Grade $grade = null, array $attributes = []): User
    {
        return User::factory()->teacher($school, $grade)->create($attributes);
    }

    /**
     * Create a Guardian / Parent user.
     */
    public function createGuardian(array $attributes = []): User
    {
        return User::factory()->guardian()->create($attributes);
    }
}
