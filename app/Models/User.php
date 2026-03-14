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
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'name_en',
        'national_id',
        'email',
        'password',
        'phone',
        'user_code',
        'role',
        'image',
        'address',
        'is_active',

        // Guardian/Parent specific
        'home_latitude',
        'home_longitude',
        'proximity_alert_distance',
        'home_number',
        'preferred_language',

        // Driver/Supervisor specific
        'license_number',
        'license_expiry_date',
        'emergency_contact_name',
        'emergency_contact_phone',
        'status',

        // Student specific
        'full_name',
        'full_name_en',
        'student_code',
        'gender',
        'grade',

        'guardian_id',
        'assigned_supervisor_id',
        'morning_group_id',
        'afternoon_group_id',
        'forth_route_id',
        'back_route_id',

        // School specific
        'location',
        'has_transport',
        'has_attendance',
        'logo',

        'school_id',
        'fcm_token',
    ];

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

    // ── العلاقات الأساسية ──────────────────────────────

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    // ── علاقات الشات ──────────────────────────────────

    /**
     * المحادثات التي يشارك فيها المستخدم
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'chat_participants')
            ->withPivot('role', 'last_read_at')
            ->withTimestamps();
    }

    /**
     * الرسائل المرسلة من هذا المستخدم
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Route notifications for the FCM channel.
     *
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return string|null
     */
    public function routeNotificationForFcm($notification)
    {
        return $this->fcm_token;
    }
}
