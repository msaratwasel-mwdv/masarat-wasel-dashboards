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
    // 🌐 كشف لغة التطبيق الحالية (افتراضياً عربي)
    $acceptLanguage = request()->header('Accept-Language') ?? '';
    if (!empty($acceptLanguage)) {
        $isEn = str_starts_with($acceptLanguage, 'en');
    } else {
        $isEn = (request()->input('lang') === 'en' 
            || ($user && $user->preferred_language === 'en')
            || app()->getLocale() === 'en');
    }

    \Log::debug("Authorizing bus.{$id} for user {$user->id} (" . ($user->role ?? 'no role') . ")");
    try {
        // 1. Get the bus. Use find() to handle missing bus gracefully.
        $bus = \App\Models\Bus::find($id);
        if (!$bus) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                $isEn ? "Bus with ID {$id} not found." : "الحافلة ذات المعرف {$id} غير موجودة."
            );
        }

        // 2. Validate user and role
        if (!$user) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                $isEn ? "No authenticated user." : "لا يوجد مستخدم مسجل الدخول."
            );
        }

        $role = $user->role ?? $user->roles()->first()?->name;
        if (!$role) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                $isEn ? "User has no assigned role." : "المستخدم لا يملك أي صلاحيات أو دور محدد."
            );
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
            if (!$authorized) {
                throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                    $isEn ? "School admin is not authorized for this bus." : "مدير المدرسة غير مصرح له بمتابعة هذه الحافلة."
                );
            }
            return true;
        }

        // Driver or Assistant or Field Supervisor
        if (in_array($role, ['driver', 'assistant', 'field_supervisor', 'fieldSupervisor'])) {
            $authorized = (int) $bus->driver_id === (int) $user->id 
                || (int) $bus->assistant_id === (int) $user->id
                || (int) $bus->field_supervisor_id === (int) $user->id;
            \Log::debug("Staff ({$role}) authorization for bus.{$id}: " . ($authorized ? 'Allowed' : 'Denied'));
            if (!$authorized) {
                throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                    $isEn ? "Staff member is not assigned to this bus." : "الموظف غير مرتبط بهذه الحافلة."
                );
            }
            return true;
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
            if (!$authorized) {
                throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                    $isEn 
                        ? "Parent does not have any active children assigned to this bus." 
                        : "ولي الأمر ليس لديه أي طلاب نشطين مرتبطين بهذه الحافلة حالياً لليوم الجديد."
                );
            }
            return true;
        }

        \Log::warning("Broadcasting auth failed: Role {$role} not permitted for bus.{$id}");
        throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
            $isEn 
                ? "Role {$role} is not permitted to track this bus." 
                : "الدور {$role} غير مصرح له بمتابعة هذه الحافلة."
        );
    } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
        throw $e;
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

