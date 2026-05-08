<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price_per_student',
        'is_active',
        'max_buses',
        'has_driver_app',
        'has_parent_app',
        'has_supervisor_app',
        'notifications_limit',
        'has_reports',
        'has_api_access',
        'has_dedicated_support',
        'sort_order',
        'badge',
        'currency',
    ];

    protected $appends = [
        'feature_list',
    ];

    protected $casts = [
        'price_per_student' => 'decimal:2',
        'is_active' => 'boolean',
        'max_buses' => 'integer',
        'has_driver_app' => 'boolean',
        'has_parent_app' => 'boolean',
        'has_supervisor_app' => 'boolean',
        'has_reports' => 'boolean',
        'has_api_access' => 'boolean',
        'has_dedicated_support' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getFeatureListAttribute()
    {
        $features = [];
        
        if ($this->max_buses) {
            $features[] = __("Up to :count buses", ['count' => $this->max_buses]);
        } else {
            $features[] = __("Unlimited Buses");
        }

        if ($this->has_driver_app) $features[] = __("Driver App");
        if ($this->has_parent_app) $features[] = __("Parent App");
        if ($this->has_supervisor_app) $features[] = __("Supervisor App");
        
        if ($this->notifications_limit) {
            $features[] = $this->notifications_limit === 'unlimited' ? __("Unlimited Notifications") : __("System Notifications");
        }

        if ($this->has_reports) $features[] = __("Advanced Reports");
        if ($this->has_api_access) $features[] = __("API Access");
        if ($this->has_dedicated_support) $features[] = __("Dedicated Support 24/7");

        return $features;
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function schools()
    {
        return $this->hasMany(School::class);
    }
}
