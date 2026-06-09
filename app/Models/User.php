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
        'last_name_ar',
        'first_name_en',
        'last_name_en',
        'national_id',
        'email',
        'password',
        'phone',
        'image',
        'address',
        'latitude',
        'longitude',
        'preferred_language',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['name', 'name_en', 'role', 'is_active'];

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

    public function fcmTokens(): HasMany
    {
        return $this->hasMany(FcmToken::class);
    }

    /**
     * Get the user's primary role name (first role).
     * Uses the pre-loaded roles collection (no extra query if eager loaded).
     */
    public function getRoleAttribute(): ?string
    {
        // Use getRelationValue to avoid triggering load if not loaded
        $roles = $this->getRelationValue('roles');
        return $roles ? $roles->first()?->name : null;
    }

    public function getIsActiveAttribute(): bool
    {
        // For roles with extension tables, check their status enum ONLY if loaded to avoid recursion
        if ($this->hasRole('driver') && $this->relationLoaded('driver')) {
            return ($this->driver?->status ?? 'inactive') === 'active';
        }
        if ($this->hasRole('assistant') && $this->relationLoaded('assistant')) {
            return ($this->assistant?->status ?? 'inactive') === 'active';
        }
        if ($this->hasRole('field_supervisor') && $this->relationLoaded('fieldSupervisor')) {
            return ($this->fieldSupervisor?->status ?? 'inactive') === 'active';
        }
        if ($this->hasRole('teacher') && $this->relationLoaded('teacher')) {
            return ($this->teacher?->status ?? 'inactive') === 'active';
        }
        if ($this->hasRole('parent') && $this->relationLoaded('guardian')) {
            return ($this->guardian?->status ?? 'inactive') === 'active';
        }
        if ($this->hasRole('school_admin') && $this->relationLoaded('schoolAdmin')) {
            return ($this->schoolAdmin?->status ?? 'inactive') === 'active';
        }

        // Default or for other roles (like administrators/unloaded relations), assume true to prevent hang
        return true;
    }

    /**
     * Get the user's full name based on components.
     * Reconstructs full name from separate components.
     */
    public function getNameAttribute(): string
    {
        $isEn = app()->getLocale() === 'en';

        if ($isEn) {
            $nameEn = $this->name_en;
            if (!empty(trim($nameEn)) && $nameEn !== $this->email) {
                return $nameEn;
            }
        }

        $names = [
            $this->first_name_ar,
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
     * Helper to split a full name into 4 parts.
     */
    public static function parseFullName(?string $fullName): array
    {
        if (empty($fullName)) {
            return ['', '', '', ''];
        }
        $parts = array_filter(explode(' ', trim($fullName)));

        $first = count($parts) > 0 ? array_shift($parts) : '';
        $last = implode(' ', $parts);

        // Return 4 elements to avoid breaking list() destructuring in controllers
        // The middle names are empty as they are deprecated
        return [$first, '', '', $last];
    }

    /**
     * Get the user's full name in English.
     */
    public function getNameEnAttribute(): string
    {
        $namesEn = [
            $this->first_name_en,
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
     * Get the user's normalized avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (empty($this->image)) {
            return null;
        }

        if (str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        try {
            return url(\Illuminate\Support\Facades\Storage::url($this->image));
        } catch (\Exception $e) {
            return asset('storage/' . ltrim($this->image, '/'));
        }
    }

    /**
     * Check if the user has a given role by name.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    /**
     * Resolve the user's school_id from the appropriate extension table OR assigned bus.
     * school_id does NOT exist on the users table directly.
     */
    public function getSchoolId(): ?int
    {
        // 1. Check extension tables (Teachers and School Admins are definitely linked)
        $schoolId = $this->schoolAdmin?->school_id
            ?? $this->teacher?->school_id;

        if ($schoolId) return $schoolId;

        // 2. For drivers, assistants, and field supervisors, resolve via assigned bus
        return $this->assignedBus?->school_id
            ?? $this->assignedBusAsAssistant?->school_id
            ?? $this->assignedBusAsFieldSupervisor?->school_id
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

    // ── Field supervisor profile ───────────────────

    // ── Bus Assignments ─────────────────────────────────

    public function assignedBus(): HasOne
    {
        return $this->hasOne(Bus::class, 'driver_id');
    }

    public function assignedBusAsFieldSupervisor(): HasOne
    {
        return $this->hasOne(Bus::class, 'field_supervisor_id');
    }

    public function assignedBusAsAssistant(): HasOne
    {
        return $this->hasOne(Bus::class, 'assistant_id');
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
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'guardian_student', 'guardian_id', 'student_id')
            ->withPivot('relationship_type')
            ->withTimestamps();
    }

    // ── FCM ─────────────────────────────────────────────
    // Centralized multi-device FCM support via fcm_tokens table.

    /**
     * Accessor for fcm_token (Legacy support).
     * Returns the primary (most recent) token as a string.
     */
    public function getFcmTokenAttribute(): ?string
    {
        return $this->fcmTokens()->latest('updated_at')->value('token');
    }

    /**
     * Route notifications for the FCM channel.
     * Returns all registered device tokens for this user.
     *
     * @param  \Illuminate\Notifications\Notification|null  $notification
     * @return array
     */
    public function routeNotificationForFcm($notification = null): array
    {
        return $this->fcmTokens()->pluck('token')->unique()->filter()->toArray();
    }

    /**
     * Register or update an FCM token for the user.
     * Centralized multi-device support with device identity tracking.
     */
    public function updateFcmToken($fcmToken, $deviceType = 'android', $deviceName = null, $deviceId = null, $appBundleId = null, $preferredLanguage = null): void
    {
        if (!$fcmToken) {
            return;
        }

        // 1. Cleanup: Ensure this token is not associated with any other user
        // (Prevents duplicate delivery if a user logs in on a shared device)
        \App\Models\FcmToken::where('token', $fcmToken)
            ->where('user_id', '!=', $this->id)
            ->delete();

        // 2. We use the TOKEN as the primary key for search to avoid Unique Violation
        $updateData = [
            'user_id'       => $this->id,
            'device_id'     => $deviceId,
            'device_type'   => $deviceType,
            'device_name'   => $deviceName,
            'app_bundle_id' => $appBundleId,
        ];

        if ($preferredLanguage !== null) {
            $updateData['preferred_language'] = $preferredLanguage;
        }

        \App\Models\FcmToken::updateOrCreate(
            ['token' => $fcmToken], // Search by token only because it's UNIQUE
            $updateData
        );

        \Illuminate\Support\Facades\Log::debug("[FCM] Token updated for user {$this->id}", [
            'device_id'   => $deviceId,
            'device_name' => $deviceName,
            'has_token'   => true,
            'preferred_language' => $preferredLanguage
        ]);
    }

    /**
     * Get tokens with their associated app bundle IDs.
     */
    public function getFcmTokensWithBundleIds(): \Illuminate\Support\Collection
    {
        return $this->fcmTokens()->select(['token', 'app_bundle_id', 'device_type', 'preferred_language'])->get();
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
    /**
     * School accessor — uses pre-loaded relationships when available.
     * Avoids N+1 by checking relationLoaded() before accessing.
     */
    public function getSchoolAttribute()
    {
        // If school was set manually (e.g. from eager-loaded data), return it
        if (isset($this->attributes['_cached_school'])) {
            return $this->attributes['_cached_school'];
        }
        $schoolId = $this->getSchoolIdEfficient();
        if (!$schoolId) return null;
        $school = \App\Models\School::find($schoolId);
        $this->attributes['_cached_school'] = $school;
        return $school;
    }

    public function getSchoolIdAttribute(): ?int
    {
        return $this->getSchoolIdEfficient();
    }

    /**
     * Efficient school ID resolution — only queries relationships that are loaded.
     * For unloaded relationships, falls back to getSchoolId().
     */
    public function getSchoolIdEfficient(): ?int
    {
        // Admin users don't belong to any school
        if ($this->relationLoaded('roles') && $this->roles->contains('name', 'admin')) {
            return null;
        }

        // Fast path: check already-loaded relationships first
        if ($this->relationLoaded('schoolAdmin') && $this->schoolAdmin?->school_id) {
            return $this->schoolAdmin->school_id;
        }
        if ($this->relationLoaded('teacher') && $this->teacher?->school_id) {
            return $this->teacher->school_id;
        }
        if ($this->relationLoaded('assignedBus') && $this->assignedBus?->school_id) {
            return $this->assignedBus->school_id;
        }
        if ($this->relationLoaded('assignedBusAsAssistant') && $this->assignedBusAsAssistant?->school_id) {
            return $this->assignedBusAsAssistant->school_id;
        }
        if ($this->relationLoaded('assignedBusAsFieldSupervisor') && $this->assignedBusAsFieldSupervisor?->school_id) {
            return $this->assignedBusAsFieldSupervisor->school_id;
        }

        // Slow path: query DB (only for single-user contexts like auth)
        return $this->getSchoolId();
    }

    public function scopeWithRole($query, string $role)
    {
        return $query->whereHas('roles', fn($q) => $q->where('name', $role));
    }

    /**
     * Get the history of buses assigned to this driver.
     */
/*     public function busHistory(): HasMany
    {
        return $this->hasMany(BusDriverAssignment::class, 'driver_id');
    } */

    /**
     * Scope a query to only include users belonging to a specific school.
     */
    public function scopeAtSchool($query, $schoolId)
    {
        return $query->where(function($q) use ($schoolId) {
            $q->whereHas('schoolAdmin', fn($sq) => $sq->where('school_id', $schoolId))
              ->orWhereHas('teacher', fn($sq) => $sq->where('school_id', $schoolId))
              ->orWhereHas('assignedBus', fn($sq) => $sq->where('school_id', $schoolId))
              ->orWhereHas('assignedBusAsAssistant', fn($sq) => $sq->where('school_id', $schoolId))
              ->orWhereHas('assignedBusAsFieldSupervisor', fn($sq) => $sq->where('school_id', $schoolId))
              ->orWhereHas('students.enrollments.classroom', fn($sq) => $sq->atSchool($schoolId));
        });
    }
}
