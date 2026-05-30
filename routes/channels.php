<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * قناة خاصة بالمحادثة — فقط المشاركون يمكنهم الاستماع
 */
Broadcast::channel('chat.conversation.{conversationId}', function ($user, $conversationId) {
    return $user->conversations()->where('conversations.id', $conversationId)->exists();
});

/**
 * قناة خاصة بولي الأمر — لاستقبال تحديثات حالة الطلاب فورياً
 */
Broadcast::channel('guardian.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * قناة خاصة بمتابعة موقع الباص لحظياً
 */
Broadcast::channel('bus.{id}', function ($user, $id) {
    \Log::debug("Authorizing bus.{$id} for user {$user->id} ({$user->role})");
    try {
        // 1. Get the bus. Use find() to handle missing bus gracefully.
        $bus = \App\Models\Bus::find($id);
        if (!$bus) {
            \Log::warning("Broadcasting auth failed: Bus {$id} not found.");
            return false;
        }

        // 2. Validate user and role
        if (!$user) {
            \Log::warning("Broadcasting auth failed: No authenticated user.");
            return false;
        }

        $role = $user->role; // Accessor in User model
        if (!$role) {
            \Log::warning("Broadcasting auth failed: User {$user->id} has no role.");
            return false;
        }

        // Admin or School Admin
        if ($role === 'admin') {
            \Log::debug("Admin authorized for bus.{$id}");
            return true;
        }
        
        if ($role === 'school_admin') {
            $userSchoolId = $user->getSchoolId();
            $authorized = $userSchoolId !== null && (int) $bus->school_id === (int) $userSchoolId;
            \Log::debug("School Admin authorization for bus.{$id}: " . ($authorized ? 'Allowed' : 'Denied'));
            return $authorized;
        }

        // Driver or Assistant or Field Supervisor
        if (in_array($role, ['driver', 'assistant', 'field_supervisor', 'fieldSupervisor'])) {
            $authorized = (int) $bus->driver_id === (int) $user->id 
                || (int) $bus->assistant_id === (int) $user->id
                || (int) $bus->field_supervisor_id === (int) $user->id;
            \Log::debug("Staff ({$role}) authorization for bus.{$id}: " . ($authorized ? 'Allowed' : 'Denied'));
            return $authorized;
        }

        // Guardian check
        if ($role === 'guardian' || $role === 'parent') {
            $authorized = \App\Models\Student::whereHas('guardians', function($q) use ($user) {
                    $q->where('users.id', $user->id);
                })
                ->where(function($q) use ($bus) {
                    $q->where('forth_bus_id', $bus->id)
                      ->orWhere('back_bus_id', $bus->id);
                })
                ->exists();
            \Log::debug("Guardian/Parent authorization for bus.{$id}: " . ($authorized ? 'Allowed' : 'Denied'));
            return $authorized;
        }

        \Log::warning("Broadcasting auth failed: Role {$role} not permitted for bus.{$id}");
        return false;
    } catch (\Throwable $e) {
        report($e);
        \Log::error("Broadcasting auth FATAL error for bus.{$id}: " . $e->getMessage(), [
            'user_id' => $user->id ?? 'unknown',
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    }
});

/**
 * Dashboard real-time stats channels
 */
Broadcast::channel('admin.dashboard', function ($user) {
    return $user->role === 'admin';
});

Broadcast::channel('school.dashboard.{schoolId}', function ($user, $schoolId) {
    return $user->role === 'school_admin' && (int) $user->getSchoolId() === (int) $schoolId;
});

/**
 * Emergencies channel for admins
 */
Broadcast::channel('admin.emergencies', function ($user) {
    return $user->role === 'admin';
});

/**
 * Bus requests channel for admins
 */
Broadcast::channel('admin.bus-requests', function ($user) {
    return $user->role === 'admin';
});

