<?php

namespace Database\Factories;

use App\Models\Assistant;
use App\Models\Driver;
use App\Models\FieldSupervisor;
use App\Models\Grade;
use App\Models\Guardian;
use App\Models\Role;
use App\Models\School;
use App\Models\SchoolAdmin;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name_ar' => fake('ar_SA')->firstName(),
            'last_name_ar' => fake('ar_SA')->lastName(),
            'first_name_en' => fake('en_US')->firstName(),
            'last_name_en' => fake('en_US')->lastName(),
            'national_id' => fake()->unique()->numerify('1#########'),
            'phone' => fake()->unique()->numerify('9665########'),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'is_whatsapp_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function admin(): static
    {
        return $this->afterCreating(function (User $user) {
            $role = Role::firstOrCreate(['name' => 'admin']);
            $user->roles()->syncWithoutDetaching([$role->id]);
        });
    }

    public function schoolAdmin(?School $school = null): static
    {
        return $this->afterCreating(function (User $user) use ($school) {
            $role = Role::firstOrCreate(['name' => 'school_admin']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            $targetSchool = $school ?? School::factory()->create();
            SchoolAdmin::create([
                'user_id' => $user->id,
                'school_id' => $targetSchool->id,
                'status' => 'active',
            ]);
        });
    }

    public function driver(array $attributes = []): static
    {
        return $this->afterCreating(function (User $user) use ($attributes) {
            $role = Role::firstOrCreate(['name' => 'driver']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            Driver::create(array_merge([
                'user_id' => $user->id,
                'license_number' => 'LIC-'.fake()->unique()->numerify('########'),
                'license_expiry_date' => now()->addYears(2)->toDateString(),
                'status' => 'active',
            ], $attributes));
        });
    }

    public function assistant(array $attributes = []): static
    {
        return $this->afterCreating(function (User $user) use ($attributes) {
            $role = Role::firstOrCreate(['name' => 'assistant']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            Assistant::create(array_merge([
                'user_id' => $user->id,
                'status' => 'active',
            ], $attributes));
        });
    }

    public function fieldSupervisor(array $attributes = []): static
    {
        return $this->afterCreating(function (User $user) use ($attributes) {
            $role = Role::firstOrCreate(['name' => 'field_supervisor']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            FieldSupervisor::create(array_merge([
                'user_id' => $user->id,
                'status' => 'active',
            ], $attributes));
        });
    }

    public function teacher(?School $school = null, ?Grade $grade = null, array $attributes = []): static
    {
        return $this->afterCreating(function (User $user) use ($school, $grade, $attributes) {
            $role = Role::firstOrCreate(['name' => 'teacher']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            Teacher::create(array_merge([
                'user_id' => $user->id,
                'school_id' => $school?->id,
                'grade_id' => $grade?->id,
                'status' => 'active',
            ], $attributes));
        });
    }

    public function guardian(array $attributes = []): static
    {
        return $this->afterCreating(function (User $user) use ($attributes) {
            $role = Role::firstOrCreate(['name' => 'parent']);
            $user->roles()->syncWithoutDetaching([$role->id]);

            Guardian::create(array_merge([
                'user_id' => $user->id,
                'status' => 'active',
            ], $attributes));
        });
    }
}
