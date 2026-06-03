<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class School extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_en',
        'logo',
        'latitude',
        'longitude',
        'address',
        'city',
        'status',
        'is_active',
        'contact_email',
        'contact_phone',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['logo_url'];

    /**
     * Get the fully qualified URL for the school's logo.
     * This professionally handles HTTPS and correct storage paths.
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) {
            return null;
        }

        // If the logo is already a full URL (e.g., S3 or external), return it as is.
        if (filter_var($this->logo, FILTER_VALIDATE_URL)) {
            return $this->logo;
        }

        // Use Laravel's Storage facade to generate the correct URL (handles https automatically if APP_URL is https)
        return \Illuminate\Support\Facades\Storage::url($this->logo);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array
     */
    protected $hidden = [
        // 'address', unhidden to support frontend editing
    ];

    /**
     * School admin users — via school_admins extension table.
     * NOTE: users do NOT have school_id directly on the users table.
     */
    public function schoolAdmins(): HasMany
    {
        return $this->hasMany(SchoolAdmin::class);
    }

    /**
     * @deprecated school_id does not exist on users table.
     * Use schoolAdmins() or hasManyThrough(User, SchoolAdmin) instead.
     */
    /**
     * Get all users directly associated with this school.
     * Since school_id is not on the users table, we look through our extensions.
     */
    public function users(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        // This is a custom relationship to simulate a direct link for convenience
        return $this->belongsToMany(User::class, 'school_admins', 'school_id', 'user_id');
    }


    public function enrollments()
    {
        // School -> Grades -> Classrooms -> Enrollments
        // Since Laravel doesn't support 3 levels of HasManyThrough easily, 
        // we can return a query or use a custom relationship if needed.
        // For simplicity, let's just make it return a query for now or keep it as Classroom based if we can filter it correctly.
        return $this->hasManyThrough(
            StudentSchoolEnrollment::class,
            Classroom::class,
            'id', // FK on classrooms (this will be fixed below) - wait, this is tricky.
            'classroom_id',
            'id',
            'grade_id'
        )->whereHas('classroom.grade', fn($q) => $q->where('school_id', $this->id));
    }

    public function buses(): HasMany
    {
        return $this->hasMany(Bus::class);
    }

    public function busRequests(): HasMany
    {
        return $this->hasMany(BusRequest::class);
    }

    public function fieldTrips()
    {
        return $this->hasMany(FieldTrip::class);
    }

    public function classrooms()
    {
        return $this->hasManyThrough(Classroom::class, Grade::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function currentSubscription()
    {
        return $this->hasOne(Subscription::class)->whereIn('status', ['active', 'trialing'])->latest();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(string $feature): bool
    {
        return true;
    }

    public function maxBuses(): ?int
    {
        $subscription = $this->currentSubscription;
        if (!$subscription || !$subscription->plan) return 0;
        
        return $subscription->plan->max_buses;
    }

    public function totalOwed(): float
    {
        // Calculate pending installments amount directly
        return $this->installments()
            ->whereIn('status', ['pending', 'overdue'])
            ->sum('amount');
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }
}


