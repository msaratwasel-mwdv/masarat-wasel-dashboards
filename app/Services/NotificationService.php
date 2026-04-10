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
        ?string $fromUserName = null
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
                $fcmToken = $user->routeNotificationForFcm(null);
                if ($fcmToken) {
                    $this->sendFcmNotification(
                        fcmToken: $fcmToken,
                        title: $title,
                        message: $message,
                        data: array_merge($data ?? [], [
                            'notification_id' => (string) $notification->id,
                            'type'            => $type,
                        ])
                    );
                } else {
                    Log::warning('[FCM] المستخدم ' . $userId . ' لا يمتلك fcm_token مسجّلاً.');
                }
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Send Error: ' . $e->getMessage());
        }

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
        // تحويل جميع القيم إلى string لأن FCM data payload يقبل strings فقط
        $stringData = array_map('strval', $data);

        $fcmMessage = CloudMessage::new()
            ->withNotification(FcmNotification::create($title, $message))
            ->withData($stringData);

        Log::info('[FCM] Sending notification via Multicast (Single Token)', [
            'token'   => substr($fcmToken, 0, 20) . '...',
            'title'   => $title,
            'message' => $message,
            'data'    => $stringData,
        ]);

        $messaging = $this->getMessaging();
        if (!$messaging) {
            Log::error('[FCM] Cannot send notification: Messaging service not available.');
            return;
        }

        $messaging->sendMulticast($fcmMessage, [$fcmToken]);

        Log::info('[FCM] Notification request sent.');
    }

    /**
     * إرسال إشعار لعدة مستخدمين.
     */
    public function sendToUsers(
        array $userIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $notifications = collect();

        foreach ($userIds as $userId) {
            $notifications->push(
                $this->sendToUser($userId, $type, $title, $message, $data, $fromUserName)
            );
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
        if (empty($fcmTokens)) {
            return;
        }

        $stringData = array_map('strval', $data);

        $fcmMessage = CloudMessage::new()
            ->withNotification(FcmNotification::create($title, $message))
            ->withData($stringData);

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
                    Log::error('[FCM] Individual failure', [
                        'token' => substr($failure->target()->value(), 0, 15) . '...',
                        'error' => $failure->error()->getMessage(),
                    ]);
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
        $driverIds = \Illuminate\Support\Facades\DB::table('drivers')
            ->whereIn('bus_id', $busIds)
            ->pluck('user_id')
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
        $student = \App\Models\Student::with('guardians.user')->find($studentId);

        if (! $student || $student->guardians->isEmpty()) {
            \Illuminate\Support\Facades\Log::warning("[Notification] Student {$studentId} has no guardian, skipping notification.");
            return null;
        }

        // Notify the first guardian as fallback or adapt to multiple
        return $this->sendToUser(
            userId: $student->guardians->first()->user_id,
            type: $type,
            title: $title,
            message: $message,
            data: $data,
            fromUserName: 'نظام المدرسة'
        );
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
            ->join('guardians', 'guardian_student.guardian_id', '=', 'guardians.id')
            ->where(function($q) use ($busId) {
                $q->where('students.forth_bus_id', $busId)
                  ->orWhere('students.back_bus_id', $busId);
            })
            ->whereNotNull('guardians.user_id')
            ->pluck('guardians.user_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($guardianUserIds, $type, $title, $message, $data, 'نظام النقل');
    }
}


