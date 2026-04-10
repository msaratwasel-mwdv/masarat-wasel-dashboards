<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     * NOTE: school_id does NOT exist on the users table.
     *       School association is done via extension tables (school_admins, drivers, etc.)
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name_ar',
        'second_name_ar',
        'third_name_ar',
        'last_name_ar',
        'first_name_en',
        'second_name_en',
        'third_name_en',
        'last_name_en',
        'national_id',
        'email',
        'password',
        'phone',
        'is_active',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['name', 'name_en', 'role'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ── Authorization ───────────────────────────────────

    /**
     * Many-to-many roles via user_roles pivot.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    /**
     * Get the user's primary role name (first role).
     * Used for backward compatibility with code that reads $user->role.
     */
    public function getRoleAttribute(): ?string
    {
        return $this->roles->first()?->name;
    }

    /**
     * Get the user's full name based on components.
     * Reconstructs full name from separate components.
     */
    public function getNameAttribute(): string
    {
        $names = [
            $this->first_name_ar,
            $this->second_name_ar,
            $this->third_name_ar,
            $this->last_name_ar
        ];

        // Ensure each part is UTF-8 or empty
        $names = array_map(function($n) {
            return is_string($n) ? mb_convert_encoding($n, 'UTF-8', 'UTF-8') : null;
        }, $names);

        $fullName = trim(implode(' ', array_filter($names)));

        if (empty($fullName)) {
            return $this->name_en;
        }

        $email = is_string($this->email) ? mb_convert_encoding($this->email, 'UTF-8', 'UTF-8') : '';
        return $fullName ?: $email;
    }

    /**
     * Get the user's full name in English.
     */
    public function getNameEnAttribute(): string
    {
        $namesEn = [
            $this->first_name_en,
            $this->second_name_en,
            $this->third_name_en,
            $this->last_name_en
        ];
        
        $namesEn = array_map(function($n) {
            return is_string($n) ? mb_convert_encoding($n, 'UTF-8', 'UTF-8') : null;
        }, $namesEn);

        $fullNameEn = trim(implode(' ', array_filter($namesEn)));

        $email = is_string($this->email) ? mb_convert_encoding($this->email, 'UTF-8', 'UTF-8') : '';
        return $fullNameEn ?: $email;
    }

    /**
     * Check if the user has a given role by name.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    /**
     * Resolve the user's school_id from the appropriate extension table.
     * school_id does NOT exist on the users table directly.
     * - school_admin  → school_admins.school_id
     * - driver        → drivers.school_id
     * - supervisor    → field_supervisors.school_id
     */
    public function getSchoolId(): ?int
    {
        return $this->schoolAdmin?->school_id
            ?? $this->driver?->school_id
            ?? $this->fieldSupervisor?->school_id
            ?? null;
    }

    // ── 1:1 Role Extension Tables ───────────────────────

    /**
     * School admin profile — includes school_id.
     */
    public function schoolAdmin(): HasOne
    {
        return $this->hasOne(SchoolAdmin::class);
    }

    /**
     * Driver profile — includes license info, school_id.
     */
    public function driver(): HasOne
    {
        return $this->hasOne(Driver::class);
    }

    /**
     * Field supervisor profile — includes school_id.
     */
    public function fieldSupervisor(): HasOne
    {
        return $this->hasOne(FieldSupervisor::class);
    }

    /**
     * Teacher profile — includes classroom_id.
     */
    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    /**
     * Assistant profile.
     */
    public function assistant(): HasOne
    {
        return $this->hasOne(Assistant::class);
    }

    /**
     * Guardian profile — includes fcm_token.
     */
    public function guardian(): HasOne
    {
        return $this->hasOne(Guardian::class);
    }

    // ── Legacy / Deprecated Profiles ───────────────────
    // These tables (driver_profiles, supervisor_profiles) still exist in the DB
    // but role-specific data has moved to the drivers / field_supervisors tables.

    /** @deprecated Use driver() instead */
    public function driverProfile(): HasOne
    {
        return $this->hasOne(DriverProfile::class);
    }

    /** @deprecated Use fieldSupervisor() instead */
    public function supervisorProfile(): HasOne
    {
        return $this->hasOne(SupervisorProfile::class);
    }

    // ── Bus Assignments ─────────────────────────────────

    public function assignedBus(): HasOne
    {
        return $this->hasOne(Bus::class, 'driver_id');
    }

    public function assignedBusAsSupervisor(): HasOne
    {
        return $this->hasOne(Bus::class, 'supervisor_id');
    }

    // ── Chat ────────────────────────────────────────────

    /**
     * Conversations the user participates in.
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'chat_participants')
            ->withPivot('role', 'last_read_at')
            ->withTimestamps();
    }

    /**
     * Messages sent by this user.
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    // ── Field Operations ────────────────────────────────

    public function fieldViolations(): HasMany
    {
        return $this->hasMany(Violation::class, 'field_supervisor_id');
    }

    public function fieldInspections(): HasMany
    {
        return $this->hasMany(Inspection::class, 'field_supervisor_id');
    }

    public function reportedIncidents(): HasMany
    {
        return $this->hasMany(Incident::class, 'reporter_id');
    }

    // ── Students (via Guardian role) ────────────────────

    /**
     * Students linked to this user as guardian.
     * NOTE: This uses guardian_id on the students table — verify this FK exists.
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'guardian_id');
    }

    // ── FCM ─────────────────────────────────────────────

    /**
     * Route notifications for the FCM channel.
     * NOTE: fcm_token does NOT exist on the users table.
     *       It lives on each extension table (drivers.fcm_token, guardians.fcm_token, etc.)
     *
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return string|null
     */
    public function routeNotificationForFcm($notification): ?string
    {
        // Resolve from the appropriate extension table based on role
        return $this->driver?->fcm_token
            ?? $this->fieldSupervisor?->fcm_token
            ?? $this->teacher?->fcm_token
            ?? $this->assistant?->fcm_token
            ?? $this->guardian?->fcm_token
            ?? null;
    }

    // ── Classrooms (Teacher role) ───────────────────────

    public function classroom(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
    {
        return $this->hasOneThrough(
            Classroom::class,
            Teacher::class,
            'user_id',      // Foreign key on teachers table
            'id',           // Foreign key on classrooms table
            'id',           // Local key on users table
            'classroom_id'  // Local key on teachers table
        );
    }

    /**
     * Get the school attribute accessor to emulate the school relationship.
     * This uses the getSchoolId() helper to look up the active school for the user.
     */
    public function getSchoolAttribute()
    {
        $schoolId = $this->getSchoolId();
        return $schoolId ? \App\Models\School::find($schoolId) : null;
    }

    /**
     * Get the history of buses assigned to this driver.
     */
    public function busHistory(): HasMany
    {
        return $this->hasMany(BusDriverAssignment::class, 'driver_id');
    }
}


