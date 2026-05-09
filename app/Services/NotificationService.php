<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;

class NotificationService
{
    public function __construct() {}

    /**
     * الحصول علىMessaging instance مع معالجة الأخطاء
     */
    protected function getMessaging(): ?Messaging
    {
        try {
            return app(Messaging::class);
        } catch (\Exception $e) {
            Log::error('[FCM] Firebase Messaging could not be initialized. Check service-account.json: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * إرسال إشعار لمستخدم واحد (DB + Firebase FCM Push).
     */
    public function sendToUser(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null,
        bool $immediate = false
    ): Notification {
        // 1. حفظ الإشعار في قاعدة البيانات
        $notification = Notification::create([
            'user_id'          => $userId,
            'type'             => $type,
            'title'            => $title,
            'message'          => $message,
            'data'             => $data,
            'from_user_name'   => $fromUserName,
            'status'           => 'unread',
            'recipient_type'   => 'individual',
            'total_recipients' => 1,
        ]);

        // 2. إرسال Push Notification عبر Firebase FCM
        try {
            $user = User::find($userId);
            if ($user) {
                $fcmTokens = $user->routeNotificationForFcm(null);
                if (!empty($fcmTokens)) {
                    $this->sendMulticast(
                        fcmTokens: $fcmTokens,
                        title: $title,
                        message: $message,
                        data: array_merge($data ?? [], [
                            'notification_id' => (string) $notification->id,
                            'type'            => $type,
                        ])
                    );
                } else {
                    Log::warning('[FCM] المستخدم ' . $userId . ' لا يمتلك fcm_tokens مسجّلة.');
                }
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Send Error: ' . $e->getMessage());
        }
        
        // 3. بث الحدث لحظياً عبر Websockets (Reverb)
        event(new \App\Events\NotificationPushed($notification, $userId));

        return $notification;
    }

    /**
     * إرسال Push Notification عبر Firebase Cloud Messaging (Admin SDK).
     *
     * @param  string  $fcmToken  رمز جهاز المستخدم في Firebase
     * @param  string  $title     عنوان الإشعار
     * @param  string  $message   نص الإشعار
     * @param  array   $data      بيانات إضافية (data payload) — يجب أن تكون strings
     */
    protected function sendFcmNotification(
        string $fcmToken,
        string $title,
        string $message,
        array $data = []
    ): void {
        $this->sendMulticast([$fcmToken], $title, $message, $data);
    }

    /**
     * إرسال إشعار لعدة مستخدمين — محسّن بـ bulk insert + FCM multicast.
     */
    public function sendToUsers(
        array $userIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        if (empty($userIds)) {
            return collect();
        }

        $now = now();

        // 1. Bulk DB Insert — all notifications in one query
        $notificationsData = array_map(fn($userId) => [
            'user_id'          => $userId,
            'type'             => $type,
            'title'            => $title,
            'message'          => $message,
            'data'             => $data ? json_encode($data) : null,
            'from_user_name'   => $fromUserName,
            'status'           => 'unread',
            'recipient_type'   => 'individual',
            'total_recipients' => 1,
            'created_at'       => $now,
            'updated_at'       => $now,
        ], $userIds);

        Notification::insert($notificationsData);

        // 2. Fetch inserted notifications for return value
        $notifications = Notification::whereIn('user_id', $userIds)
            ->where('type', $type)
            ->where('created_at', '>=', $now->subSecond())
            ->get();

        // 3. FCM Multicast — send to all tokens in one API call
        try {
            $users = User::whereIn('id', $userIds)->get();
            $fcmTokens = [];
            foreach ($users as $user) {
                $tokens = $user->routeNotificationForFcm(null);
                if (!empty($tokens)) {
                    $fcmTokens = array_merge($fcmTokens, $tokens);
                }
            }

            $fcmTokens = array_unique($fcmTokens);

            if (!empty($fcmTokens)) {
                $this->sendMulticast(
                    fcmTokens: $fcmTokens,
                    title: $title,
                    message: $message,
                    data: array_merge($data ?? [], ['type' => $type])
                );
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Bulk Send Error: ' . $e->getMessage());
        }

        // 4. بث الحدث لحظياً عبر Websockets (Reverb) لكل مستخدم
        foreach ($notifications as $notification) {
            event(new \App\Events\NotificationPushed($notification));
        }

        return $notifications;
    }

    /**
     * إرسال إشعار لعدة أجهزة مرة واحدة (Multicast) — للكفاءة.
     */
    public function sendMulticast(
        array $fcmTokens,
        string $title,
        string $message,
        array $data = []
    ): void {
        $fcmTokens = array_values(array_unique(array_filter($fcmTokens)));
        
        if (empty($fcmTokens)) {
            return;
        }

        $stringData = array_map('strval', $data);

        $fcmMessage = CloudMessage::new()
            ->withNotification(FcmNotification::create($title, $message))
            ->withData($stringData)
            ->withAndroidConfig([
                'priority' => 'high',
                'notification' => [
                    'sound' => 'default',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    'channel_id' => 'msarat_wasel_high_importance_v2',
                ],
            ])
            ->withApnsConfig([
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                        'badge' => 1,
                    ],
                ],
            ]);

        try {
            $messaging = $this->getMessaging();
            if (!$messaging) {
                Log::error('[FCM] Cannot send multicast: Messaging service not available.');
                return;
            }

            $report = $messaging->sendMulticast($fcmMessage, $fcmTokens);
            
            $successCount = $report->successes()->count();
            $failureCount = $report->failures()->count();
            
            Log::info('[FCM] Multicast result', [
                'success' => $successCount,
                'failure' => $failureCount,
            ]);

            if ($failureCount > 0) {
                foreach ($report->failures()->getItems() as $failure) {
                    $tokenValue = $failure->target()->value();
                    $errorMessage = $failure->error()->getMessage();

                    Log::error('[FCM] Individual failure', [
                        'token' => substr($tokenValue, 0, 20) . '...',
                        'error' => $errorMessage,
                    ]);

                    // Cleanup tokens that are definitely invalid/expired
                    if (str_contains($errorMessage, 'Registration token is invalid') || 
                        str_contains($errorMessage, 'The registration token is not a valid FCM registration token') ||
                        str_contains($errorMessage, 'Unregistered') ||
                        str_contains($errorMessage, 'Requested entity was not found')) {
                        
                        \App\Models\FcmToken::where('token', $tokenValue)->delete();
                        Log::info('[FCM] Deleted stale/invalid token: ' . substr($tokenValue, 0, 20) . '...');
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Multicast Exception: ' . $e->getMessage());
        }
    }

    /**
     * إرسال إشعار لسائقي حافلات محددة.
     */
    public function notifyBusDrivers(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $driverIds = \Illuminate\Support\Facades\DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('driver_id')
            ->pluck('driver_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($driverIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لمشرفي حافلات محددة.
     */
    public function notifyBusSupervisors(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $supervisorIds = \Illuminate\Support\Facades\DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('field_supervisor_id')
            ->pluck('field_supervisor_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($supervisorIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لمساعدات (مشرفات) حافلات محددة.
     */
    public function notifyBusAssistants(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $assistantIds = \Illuminate\Support\Facades\DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('assistant_id')
            ->pluck('assistant_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($assistantIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لجميع طاقم الحافلة (سائق، مساعدة، مشرف ميداني).
     */
    public function notifyBusCrew(
        int $busId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $bus = \App\Models\Bus::find($busId);
        if (!$bus) return collect();

        $userIds = array_filter([
            $bus->driver_id,
            $bus->assistant_id,
            $bus->field_supervisor_id
        ]);

        return $this->sendToUsers(array_unique($userIds), $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لجميع مديري الشركة.
     */
    public function notifyCompanyAdmins(
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $adminIds = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($adminIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لجميع مديري مدرسة معينة.
     */
    public function notifySchoolAdmins(
        int $schoolId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $adminIds = User::where('school_id', $schoolId)
            ->whereHas('roles', fn($q) => $q->where('name', 'school_admin'))
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($adminIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لولي أمر طالب معين.
     * المسار: Student → User (guardian_id يشير مباشرة لجدول users)
     */
    public function notifyStudentGuardian(
        int $studentId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): ?Notification {
        $student = \App\Models\Student::with('guardians')->find($studentId);

        if (! $student || $student->guardians->isEmpty()) {
            \Illuminate\Support\Facades\Log::warning("[Notification] Student {$studentId} has no guardian, skipping notification.");
            return null;
        }

        $notification = null;
        foreach ($student->guardians as $guardian) {
            $notification = $this->sendToUser(
                userId: $guardian->id,
                type: $type,
                title: $title,
                message: $message,
                data: $data,
                fromUserName: 'نظام المدرسة'
            );
        }

        return $notification;
    }

    /**
     * إرسال إشعار لأولياء أمور جميع طلاب باص معين.
     */
    public function notifyBusStudentsGuardians(
        int $busId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): Collection {
        $guardianUserIds = \Illuminate\Support\Facades\DB::table('students')
            ->join('guardian_student', 'students.id', '=', 'guardian_student.student_id')
            ->join('users', 'guardian_student.guardian_id', '=', 'users.id')
            ->where(function($q) use ($busId) {
                $q->where('students.forth_bus_id', $busId)
                  ->orWhere('students.back_bus_id', $busId);
            })
            ->pluck('users.id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($guardianUserIds, $type, $title, $message, $data, 'نظام النقل');
    }
}


