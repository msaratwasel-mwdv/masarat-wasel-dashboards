<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Jobs\SendFcmNotification;
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
        bool $immediate = false,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Notification {
        // 1. Save to database (Skip for chat messages to avoid badge inflation)
        if ($type === 'chat_message') {
            $notification = new Notification([
                'user_id'          => $userId,
                'type'             => $type,
                'title'            => $title,
                'title_en'         => $titleEn,
                'message'          => $message,
                'message_en'       => $messageEn,
                'data'             => $data,
                'from_user_name'   => $fromUserName,
                'status'           => 'unread',
                'recipient_type'   => 'individual',
                'total_recipients' => 1,
                'created_at'       => now(),
            ]);
        } else {
            $notification = Notification::create([
                'user_id'          => $userId,
                'type'             => $type,
                'title'            => $title,
                'title_en'         => $titleEn,
                'message'          => $message,
                'message_en'       => $messageEn,
                'data'             => $data,
                'from_user_name'   => $fromUserName,
                'status'           => 'unread',
                'recipient_type'   => 'individual',
                'total_recipients' => 1,
                'created_at'       => now(),
            ]);
        }

        $correlationId = (string) \Illuminate\Support\Str::uuid();

        // 2. Dispatch FCM Push (Prefer Async)
        try {
            $user = User::find($userId);
            if ($user) {
                $tokenRecords = $user->getFcmTokensWithBundleIds();
                
                if ($tokenRecords->isNotEmpty()) {
                    $groups = $tokenRecords->groupBy('app_bundle_id');
                    
                    foreach ($groups as $bundleId => $records) {
                        $tokensEn = [];
                        $tokensAr = [];

                        foreach ($records as $record) {
                            if ($record->preferred_language === 'en' && $titleEn) {
                                $tokensEn[] = $record->token;
                            } else {
                                $tokensAr[] = $record->token;
                            }
                        }

                        // Determine collapse key for status updates
                        $collapseKey = null;
                        if (in_array($type, ['trip_started', 'bus_nearby', 'boarding_confirmed', 'attendance_update'])) {
                            $collapseKey = $type;
                        }

                        // Send Arabic
                        if (!empty($tokensAr)) {
                            $payloadAr = array_merge($data ?? [], [
                                'notification_id' => $notification->id ? (string) $notification->id : (string) ($data['message_id'] ?? $correlationId),
                                'type'            => $type,
                                'category'        => $data['category'] ?? $type,
                                'correlation_id'  => $correlationId,
                                'language'        => 'ar',
                                'sender_name'     => $fromUserName,
                                'sender_name_en'  => $fromUserNameEn ?: $fromUserName,
                                'title_en'        => $titleEn ?: $title,
                                'message_en'      => $messageEn ?: $message,
                                'unread_count'    => (string) $this->getUnreadCount($userId),
                            ]);

                            if ($immediate) {
                                $this->sendMulticast($tokensAr, $title, $message, $payloadAr, $bundleId, false);
                            } else {
                                SendFcmNotification::dispatch($tokensAr, $title, $message, $payloadAr, $bundleId, $collapseKey);
                            }
                        }

                        // Send English
                        if (!empty($tokensEn)) {
                            $payloadEn = array_merge($data ?? [], [
                                'notification_id' => $notification->id ? (string) $notification->id : (string) ($data['message_id'] ?? $correlationId),
                                'type'            => $type,
                                'category'        => $data['category'] ?? $type,
                                'correlation_id'  => $correlationId,
                                'language'        => 'en',
                                'sender_name'     => $fromUserNameEn ?: $fromUserName,
                                'sender_name_en'  => $fromUserNameEn ?: $fromUserName,
                                'title_en'        => $titleEn ?: $title,
                                'message_en'      => $messageEn ?: $message,
                                'unread_count'    => (string) $this->getUnreadCount($userId),
                            ]);

                            if ($immediate) {
                                $this->sendMulticast($tokensEn, $titleEn, $messageEn, $payloadEn, $bundleId, false);
                            } else {
                                SendFcmNotification::dispatch($tokensEn, $titleEn, $messageEn, $payloadEn, $bundleId, $collapseKey);
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Dispatch Error: ' . $e->getMessage());
        }
        
        // 3. Real-time broadcast (Sync)
        event(new \App\Events\NotificationPushed($notification, $userId, $correlationId));

        return $notification;
    }

    /**
     * إرسال إشعار لمستخدم واحد مع دعم الترجمة التلقائية بناءً على لغته المفضلة.
     */
    public function sendTranslatedToUser(
        int $userId,
        string $type,
        string $titleKey, // مفتاح الترجمة أو النص
        string $messageKey,
        array $translationParams = [], // متغيرات الترجمة العربية أو الافتراضية
        ?array $data = null,
        ?string $fromUserName = null,
        array $translationParamsEn = [] // متغيرات الترجمة الإنجليزية
    ): Notification {
        $user = User::find($userId);
        $lang = $user ? ($user->preferred_language ?? 'ar') : 'ar';

        // استخدام translationParamsEn إذا تم توفيرها، وإلا نستخدم الافتراضية
        $paramsEn = empty($translationParamsEn) ? $translationParams : $translationParamsEn;

        // 1. الترجمة التلقائية باللغتين لحفظها في قاعدة البيانات
        $titleAr = __($titleKey, $translationParams, 'ar');
        $messageAr = __($messageKey, $translationParams, 'ar');
        
        $titleEn = __($titleKey, $paramsEn, 'en');
        $messageEn = __($messageKey, $paramsEn, 'en');

        // بالنسبة للإشعار اللحظي، نختار بناءً على لغة المستخدم الحالية
        $pushTitle = $lang === 'en' ? $titleEn : $titleAr;
        $pushMessage = $lang === 'en' ? $messageEn : $messageAr;

        // 2. Save to database (Skip for chat messages)
        if ($type === 'chat_message') {
            $notification = new Notification([
                'user_id'          => $userId,
                'type'             => $type,
                'title'            => $titleAr,
                'title_en'         => $titleEn,
                'message'          => $messageAr,
                'message_en'       => $messageEn,
                'data'             => $data,
                'from_user_name'   => $fromUserName,
                'status'           => 'unread',
                'recipient_type'   => 'individual',
                'total_recipients' => 1,
                'created_at'       => now(),
            ]);
        } else {
            $notification = Notification::create([
                'user_id'          => $userId,
                'type'             => $type,
                'title'            => $titleAr,
                'title_en'         => $titleEn,
                'message'          => $messageAr,
                'message_en'       => $messageEn,
                'data'             => $data,
                'from_user_name'   => $fromUserName,
                'status'           => 'unread',
                'recipient_type'   => 'individual',
                'total_recipients' => 1,
                'created_at'       => now(),
            ]);
        }

        $correlationId = (string) \Illuminate\Support\Str::uuid();

        // 3. تجهيز وإرسال Firebase Push Notification
        if ($user) {
            $tokenRecords = $user->getFcmTokensWithBundleIds();
            if ($tokenRecords->isNotEmpty()) {
                $groups = $tokenRecords->groupBy('app_bundle_id');
                
                foreach ($groups as $bundleId => $records) {
                    $tokens = $records->pluck('token')->toArray();

                    $payload = array_merge($data ?? [], [
                        'notification_id' => $notification->id ? (string) $notification->id : (string) ($data['message_id'] ?? $correlationId),
                        'type'            => $type,
                        'category'        => $data['category'] ?? $type,
                        'language'        => $lang,
                        'correlation_id'  => $correlationId,
                        'sender_name'     => $fromUserName,
                        // Include both languages in data payload for client-side local logic
                        'title'           => $titleAr,
                        'title_en'        => $titleEn,
                        'message'         => $messageAr,
                        'message_en'      => $messageEn,
                        'unread_count'    => (string) $this->getUnreadCount($userId),
                    ]);

                    $collapseKey = in_array($type, ['trip_started', 'bus_nearby', 'boarding_confirmed']) ? $type : null;

                    SendFcmNotification::dispatch($tokens, $pushTitle, $pushMessage, $payload, $bundleId, $collapseKey);
                }
            }
        }
        
        // 4. البث الفوري عبر WebSockets
        event(new \App\Events\NotificationPushed($notification, $userId, $correlationId));

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
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        if (empty($userIds)) {
            return collect();
        }

        $now = now();

        $notificationsData = array_map(fn($userId) => [
            'user_id'          => $userId,
            'type'             => $type,
            'title'            => $title,
            'title_en'         => $titleEn,
            'message'          => $message,
            'message_en'       => $messageEn,
            'data'             => $data ? json_encode($data) : null,
            'from_user_name'   => $fromUserName,
            'status'           => 'unread',
            'recipient_type'   => 'individual',
            'total_recipients' => 1,
            'created_at'       => $now,
            'updated_at'       => $now,
        ], $userIds);

        // 1. Bulk DB Insert (Skip for chat messages to avoid badge inflation)
        if ($type !== 'chat_message') {
            Notification::insert($notificationsData);
            
            // 2. Fetch inserted notifications for return value
            $notifications = Notification::whereIn('user_id', $userIds)
                ->where('type', $type)
                ->where('created_at', '>=', $now->subSecond())
                ->get();
        } else {
            // Create a collection of virtual models for real-time broadcast only
            $notifications = collect(array_map(function($data) {
                $n = new Notification($data);
                // Ensure data is an array for the model if it was json_encoded for bulk insert
                if (isset($data['data']) && is_string($data['data'])) {
                    $n->data = json_decode($data['data'], true);
                }
                return $n;
            }, $notificationsData));
        }

        // 3. FCM Multicast — send to all tokens in grouped batches
        try {
            $users = User::whereIn('id', $userIds)->get();
            
            $tokenGroups = []; // Format: "lang|bundleId" => [tokens...]
            $correlationId = (string) \Illuminate\Support\Str::uuid();

            foreach ($users as $user) {
                $records = $user->getFcmTokensWithBundleIds();
                if ($records->isEmpty()) continue;

                foreach ($records as $record) {
                    $lang = ($record->preferred_language === 'en' && $titleEn) ? 'en' : 'ar';
                    $bundleId = $record->app_bundle_id ?: 'com.msaratwasel.user';
                    $key = $lang . '|' . $bundleId;
                    
                    if (!isset($tokenGroups[$key])) {
                        $tokenGroups[$key] = [];
                    }
                    $tokenGroups[$key][] = $record->token;
                }
            }

            $commonData = array_merge($data ?? [], [
                'type' => $type,
                'correlation_id' => $correlationId
            ]);

            // Determine collapse key for status updates
            $collapseKey = null;
            if (in_array($type, ['trip_started', 'bus_nearby', 'boarding_confirmed', 'attendance_update'])) {
                $collapseKey = $type;
            }

            foreach ($tokenGroups as $key => $tokens) {
                [$lang, $bundleId] = explode('|', $key);
                
                $finalTitle = ($lang === 'en') ? $titleEn : $title;
                $finalMessage = ($lang === 'en') ? $messageEn : $message;
                
                $payload = array_merge($data ?? [], [
                    'type' => $type,
                    'correlation_id' => $correlationId,
                    'language' => $lang,
                    'sender_name' => ($lang === 'en' && $fromUserNameEn) ? $fromUserNameEn : $fromUserName,
                    'sender_name_en' => $fromUserNameEn ?: $fromUserName,
                    'title_en' => $titleEn ?: $title,
                    'message_en' => $messageEn ?: $message,
                    'unread_count' => (string) $this->getUnreadCount($user->id),
                ]);

                // Always queue large multicast batches for reliability
                SendFcmNotification::dispatch(array_unique($tokens), $finalTitle, $finalMessage, $payload, $bundleId, $collapseKey);
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Multicast Error in sendToUsers: ' . $e->getMessage());
        }

        // 4. بث الحدث لحظياً عبر Websockets (Reverb) لكل مستخدم
            // 3. البث الفوري لكل مستلم (WebSockets) لضمان التحديث اللحظي للواجهة
            foreach ($notifications as $notification) {
                if ($notification->user_id) {
                    event(new \App\Events\NotificationPushed($notification, null, $correlationId));
                } else {
                    // إذا كان إشعاراً جماعياً، نرسل بثاً لكل مستخدم في القائمة
                    foreach ($userIds as $uId) {
                        event(new \App\Events\NotificationPushed($notification, $uId, $correlationId));
                    }
                }
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
        array $data = [],
        ?string $topic = null,
        bool $isQueued = false,
        bool $withNotification = true
    ): void {
        $fcmTokens = array_values(array_unique(array_filter($fcmTokens)));
        
        if (empty($fcmTokens)) {
            return;
        }

        $finalTopic = $topic ?: 'com.msaratwasel.user';

        // 1. Collapse logic: Collapse status/tracking updates to avoid flooding
        // Chat messages ('new_message') should NOT be collapsed
        $collapseKey = null;
        $type = $data['type'] ?? null;
        if (in_array($type, ['trip_started', 'bus_nearby', 'boarding_confirmed', 'attendance_update'])) {
            $collapseKey = $type;
        }

        // 2. Prepare consistent string data
        $stringData = [
            'title' => (string) $title,
            'body' => (string) $message,
            'message' => (string) $message,
        ];
        
        foreach ($data as $key => $value) {
            $stringData[(string)$key] = (string)$value;
        }

        Log::info('[FCM] sendMulticast called', [
            'title' => $title,
            'message' => $message,
            'token_count' => count($fcmTokens),
            'data_title_en' => $data['title_en'] ?? 'N/A',
            'data_message_en' => $data['message_en'] ?? 'N/A',
        ]);

        // 3. Android optimizations
        $androidNotificationConfig = [
            'sound' => 'default',
            'channel_id' => 'msarat_wasel_high_importance_v3',
            'notification_priority' => 'PRIORITY_MAX',
            'visibility' => 'PUBLIC',
        ];

        // Custom channel and tags based on notification type
        if ($type === 'chat_message' && isset($data['conversation_id'])) {
            $androidNotificationConfig['channel_id'] = 'chat_messages';
            $androidNotificationConfig['tag'] = 'conversation_' . $data['conversation_id'];
        } elseif ($type === 'admin_announcement') {
            $androidNotificationConfig['channel_id'] = 'school_announcements';
            $androidNotificationConfig['default_vibrate_timings'] = true;
        }

        $apnsPayloadAps = [
            'alert' => [
                'title' => $title,
                'body' => $message,
            ],
            'sound' => 'default',
            'badge' => 1,
            'content-available' => 1,
            'mutable-content' => 1,
            'interruption-level' => 'time-sensitive',
        ];

        if ($type === 'chat_message' && isset($data['conversation_id'])) {
            $apnsPayloadAps['thread-id'] = 'conversation_' . $data['conversation_id'];
        }

        $fcmMessage = CloudMessage::new()
            ->withData($stringData)
            ->withAndroidConfig([
                'collapse_key' => $collapseKey,
                'notification' => $androidNotificationConfig,
            ]);

        if ($withNotification) {
            $fcmMessage = $fcmMessage->withNotification(FcmNotification::create($title, $message));
        }

        $fcmMessage = $fcmMessage->withApnsConfig([
                'headers' => [
                    'apns-priority' => '10',
                    'apns-push-type' => 'alert',
                    'apns-expiration' => '0',
                    'apns-topic' => $finalTopic,
                    'apns-collapse-id' => $collapseKey,
                ],
                'payload' => [
                    'aps' => $apnsPayloadAps,
                ],
            ]);

        try {
            $messaging = $this->getMessaging();
            if (!$messaging) return;

            $report = $messaging->sendMulticast($fcmMessage, $fcmTokens);
            
            // Clean up invalid tokens
            if ($report->failures()->count() > 0) {
                foreach ($report->failures()->getItems() as $failure) {
                    $errorMessage = $failure->error()->getMessage();
                    if (str_contains($errorMessage, 'Registration token is invalid') || 
                        str_contains($errorMessage, 'Unregistered') ||
                        str_contains($errorMessage, 'Requested entity was not found')) {
                        
                        \App\Models\FcmToken::where('token', $failure->target()->value())->delete();
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('[FCM] Multicast Send Error: ' . $e->getMessage());
        }
    }

    public function notifyBusDrivers(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        $driverIds = \Illuminate\Support\Facades\DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('driver_id')
            ->pluck('driver_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($driverIds, $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
    }

    public function notifyBusSupervisors(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        $supervisorIds = \Illuminate\Support\Facades\DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('field_supervisor_id')
            ->pluck('field_supervisor_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($supervisorIds, $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
    }

    public function notifyBusAssistants(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        $assistantIds = \Illuminate\Support\Facades\DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('assistant_id')
            ->pluck('assistant_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($assistantIds, $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
    }

    public function notifyBusCrew(
        int $busId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        $bus = \App\Models\Bus::find($busId);
        if (!$bus) return collect();

        $userIds = array_filter([
            $bus->driver_id,
            $bus->assistant_id,
            $bus->field_supervisor_id
        ]);

        return $this->sendToUsers(array_unique($userIds), $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
    }

    /**
     * إرسال إشعار لجميع مديري الشركة.
     */
    public function notifyCompanyAdmins(
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        $adminIds = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($adminIds, $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
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
        ?string $fromUserName = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserNameEn = null
    ): Collection {
        $adminIds = User::atSchool($schoolId)
            ->whereHas('roles', fn($q) => $q->where('name', 'school_admin'))
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($adminIds, $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
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
        ?array $data = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserName = 'نظام المدرسة',
        ?string $fromUserNameEn = 'School System'
    ): ?Notification {
        $student = \App\Models\Student::with('guardians')->find($studentId);

        if (! $student || $student->guardians->isEmpty()) {
            \Illuminate\Support\Facades\Log::warning("[Notification] Student {$studentId} has no guardian, skipping notification.");
            return null;
        }

        foreach ($student->guardians as $guardian) {
            $this->sendToUser(
                userId: $guardian->id,
                type: $type,
                title: $title,
                message: $message,
                data: $data,
                fromUserName: $fromUserName,
                immediate: false,
                titleEn: $titleEn,
                messageEn: $messageEn,
                fromUserNameEn: $fromUserNameEn
            );
        }

        return null;
    }

    /**
     * إرسال إشعار لأولياء أمور جميع طلاب باص معين.
     */
    public function notifyBusStudentsGuardians(
        int $busId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $titleEn = null,
        ?string $messageEn = null,
        ?string $fromUserName = 'نظام النقل',
        ?string $fromUserNameEn = 'Transport System'
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

        return $this->sendToUsers($guardianUserIds, $type, $title, $message, $data, $fromUserName, $titleEn, $messageEn, $fromUserNameEn);
    }

    /**
     * Get unread notification count for a user.
     */
    public function getUnreadCount(int $userId): int
    {
        return Notification::where(function($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->where('status', 'unread');
            })
            ->orWhereHas('recipients', function($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->whereNull('read_at');
            })
            ->count();
    }
}


