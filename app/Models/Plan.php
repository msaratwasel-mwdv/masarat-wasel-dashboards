<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'name_en',
        'description',
        'description_ar',
        'description_en',
        'price_per_student',
        'price_per_student_yearly',
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
        'badge_ar',
        'badge_en',
        'currency',
    ];

    protected $appends = [
        'feature_list',
        'feature_list_ar',
        'feature_list_en',
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
        // Default to Arabic features if no locale set, or just return Ar
        return $this->getFeatureListArAttribute();
    }

    public function getFeatureListArAttribute()
    {
        $features = [];
        
        if ($this->max_buses) {
            $features[] = "حتى " . $this->max_buses . " حافلة";
        } else {
            $features[] = "حافلات غير محدودة";
        }

        if ($this->has_driver_app) $features[] = "تطبيق السائق";
        if ($this->has_parent_app) $features[] = "تطبيق ولي الأمر";
        if ($this->has_supervisor_app) $features[] = "تطبيق المشرفة";
        
        if ($this->notifications_limit) {
            $features[] = $this->notifications_limit === 'unlimited' ? "إشعارات غير محدودة" : "إشعارات النظام";
        }

        if ($this->has_reports) $features[] = "تقارير متقدمة";
        if ($this->has_api_access) $features[] = "الوصول للـ API";
        if ($this->has_dedicated_support) $features[] = "دعم فني مخصص 24/7";

        return $features;
    }

    public function getFeatureListEnAttribute()
    {
        $features = [];
        
        if ($this->max_buses) {
            $features[] = "Up to " . $this->max_buses . " buses";
        } else {
            $features[] = "Unlimited Buses";
        }

        if ($this->has_driver_app) $features[] = "Driver App";
        if ($this->has_parent_app) $features[] = "Parent App";
        if ($this->has_supervisor_app) $features[] = "Supervisor App";
        
        if ($this->notifications_limit) {
            $features[] = $this->notifications_limit === 'unlimited' ? "Unlimited Notifications" : "System Notifications";
        }

        if ($this->has_reports) $features[] = "Advanced Reports";
        if ($this->has_api_access) $features[] = "API Access";
        if ($this->has_dedicated_support) $features[] = "Dedicated Support 24/7";

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
