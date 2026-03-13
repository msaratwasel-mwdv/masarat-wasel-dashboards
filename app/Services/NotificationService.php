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
    public function __construct(protected Messaging $messaging) {}

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
            if ($user && $user->fcm_token) {
                $this->sendFcmNotification(
                    fcmToken: $user->fcm_token,
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

        $this->messaging->sendMulticast($fcmMessage, [$fcmToken]);

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
            $report = $this->messaging->sendMulticast($fcmMessage, $fcmTokens);
            
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
            ->whereNotNull('supervisor_id')
            ->pluck('supervisor_id')
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
        $adminIds = User::where('role', 'admin')
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($adminIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * إرسال إشعار لولي أمر طالب معين.
     * المسار: Student → Guardian → User
     */
    public function notifyStudentGuardian(
        int $studentId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): ?Notification {
        $student = \App\Models\Student::with('guardian')->find($studentId);

        if (! $student || ! $student->guardian || ! $student->guardian->user_id) {
            return null;
        }

        return $this->sendToUser(
            userId: $student->guardian->user_id,
            type: $type,
            title: $title,
            message: $message,
            data: $data,
            fromUserName: 'نظام النقل'
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
        $guardianUserIds = \Illuminate\Support\Facades\DB::table('bus_students')
            ->join('students', 'bus_students.student_id', '=', 'students.id')
            ->join('guardians', 'students.guardian_id', '=', 'guardians.id')
            ->where('bus_students.bus_id', $busId)
            ->where('bus_students.is_active', true)
            ->whereNotNull('guardians.user_id')
            ->pluck('guardians.user_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($guardianUserIds, $type, $title, $message, $data, 'نظام النقل');
    }
}
