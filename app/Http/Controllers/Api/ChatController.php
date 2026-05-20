<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\ContactResource;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Bus;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function __construct(protected NotificationService $notificationService) {}

    /**
     * Per-request cache for valid contacts — avoids recalculating 4 times per request.
     */
    private ?\Illuminate\Support\Collection $cachedContacts = null;
    // ═══════════════════════════════════════════════════════════
    //  1. getContacts — جهات الاتصال المسموح بها حالياً
    // ═══════════════════════════════════════════════════════════

    public function getContacts(Request $request): JsonResponse
    {
        $contacts = $this->getValidContactsList($request->user());
        return $this->success(ContactResource::collection($contacts));
    }

    private function getValidContactsList(User $user): \Illuminate\Support\Collection
    {
        if ($this->cachedContacts !== null) {
            return $this->cachedContacts;
        }

        return $this->cachedContacts = $this->resolveValidContacts($user);
    }

    private function resolveValidContacts(User $user): \Illuminate\Support\Collection
    {
        $contacts = collect();
        $acceptLanguage = request()->header('Accept-Language') ?? '';
        $isEn = str_starts_with($acceptLanguage, 'en') || request()->input('lang') === 'en';

        switch ($user->role) {
            case 'parent':
                // طلاب ولي الأمر الناشطين (عبر علاقة الكثير للكثير)
                $myStudents = $user->students()
                    ->where('is_active', true)
                    ->with(['forthBus.assistant', 'forthBus.fieldSupervisor', 'forthBus.driver.user',
                            'backBus.assistant', 'backBus.fieldSupervisor', 'backBus.driver.user'])
                    ->get();

                if ($myStudents->isEmpty()) return collect();

                foreach ($myStudents as $student) {
                    $buses = array_filter([$student->forthBus, $student->backBus]);
                    $studentsNames = $student->full_name;

                    foreach ($buses as $bus) {
                        // 1. السائق
                        $driverUser = $bus->driver?->user;
                        if ($driverUser) {
                            $driverContact = clone $driverUser;
                            $driverContact->chat_description = $isEn
                                ? "Bus Driver ({$bus->bus_number}) - Student: " . $studentsNames
                                : "سائق الحافلة ({$bus->bus_number}) - الطالب: " . $studentsNames;
                            $contacts->push($driverContact);
                        }

                        // 2. المساعدة (المشرفة سابقاً)
                        if ($bus->assistant) {
                            $assistant = clone $bus->assistant;
                            $assistant->chat_description = $isEn
                                ? "Bus Assistant ({$bus->bus_number}) - Student: " . $studentsNames
                                : "مشرفة الحافلة ({$bus->bus_number}) - الطالب: " . $studentsNames;
                            $contacts->push($assistant);
                        }

                        // 3. المشرف الميداني (تم الإخفاء بناء على طلب العميل لقطع التواصل)
                        // if ($bus->fieldSupervisor) {
                        //     $fieldSv = clone $bus->fieldSupervisor;
                        //     $fieldSv->chat_description = "المشرف الميداني ({$bus->bus_number}) - الطالب: " . $studentsNames;
                        //     $contacts->push($fieldSv);
                        // }
                    }
                }
                break;

            case 'driver':
                // السائق يرى أولياء أمور الطلاب في حافلته
                $bus = \App\Models\Bus::whereHas('driver', fn($q) => $q->where('user_id', $user->id))->first();
                if ($bus) {
                    $contacts = $contacts->merge($this->getGuardianUsersForBus($bus));
                }
                break;

            case 'assistant':
            case 'field_supervisor':
                // المشرفة أو المشرف الميداني يرى أولياء أمور الطلاب في الحافلة المرتبطة به
                $busQueries = [];
                if ($user->role === 'assistant') {
                    $busQueries[] = Bus::where('assistant_id', $user->id);
                } else {
                    $busQueries[] = Bus::where('field_supervisor_id', $user->id);
                }

                foreach ($busQueries as $query) {
                    $buses = $query->get();
                    foreach ($buses as $bus) {
                        $contacts = $contacts->merge($this->getGuardianUsersForBus($bus));
                    }
                }
                break;

            case 'admin':
            case 'school_admin':
                // الأدمن يرى الجميع (مع تصفية المدرسة لأدمن المدرسة)
                $query = User::where('id', '!=', $user->id);
                
                if ($user->role === 'school_admin') {
                    $schoolId = $user->getSchoolId();
                    $query->where(function($q) use ($schoolId) {
                        $q->whereHas('schoolAdmin', fn($s) => $s->where('school_id', $schoolId))
                          ->orWhereHas('teacher', fn($t) => $t->where('school_id', $schoolId))
                          ->orWhereHas('driver', fn($d) => $d->where('school_id', $schoolId));
                        // ملاحظة: المساعدات والمشرفين الميدانيين ليسوا مرتبطين بمدرسة مباشرة حسب الطلب الأخير
                        // ولكن يمكن رؤيتهم إذا كانوا مرتبطين بباصات المدرسة
                        $q->orWhereHas('assignedBusAsAssistant', fn($b) => $b->where('school_id', $schoolId))
                          ->orWhereHas('assignedBusAsFieldSupervisor', fn($b) => $b->where('school_id', $schoolId));
                    });
                }

                $allContacts = $query->get();
                foreach($allContacts as $contact) {
                    if ($isEn) {
                        $roleNames = [
                            'driver' => 'Driver',
                            'assistant' => 'Bus Assistant',
                            'field_supervisor' => 'Field Supervisor',
                            'teacher' => 'Teacher',
                            'parent' => 'Guardian',
                            'admin' => 'Administrator',
                            'school_admin' => 'School Administrator',
                        ];
                        $roleDisp = $roleNames[$contact->role] ?? $contact->role ?? 'unspecified';
                        $contact->chat_description = "System User - Role: " . $roleDisp;
                    } else {
                        $contact->chat_description = "مستخدم النظام - دور: " . ($contact->role ?? 'غير محدد');
                    }
                    $contacts->push($contact);
                }
                break;
        }

        // في حال كان ولي الأمر لديه أكثر من طالب في نفس الباص، سيتم دمجهم أعلاه
        // ولكن للتأكيد على عدم وجود تكرار لنفس المستخدم:
        // نستخدم keyBy للتأكد من فرادة الـ ID
        return $contacts->keyBy('id')->values();
    }

    private function getGuardianUsersForBus(Bus $bus): \Illuminate\Support\Collection
    {
        // 1. Students directly assigned to this bus (morning or afternoon)
        $studentsViaBus = \App\Models\Student::where('is_active', true)
            ->where(function ($q) use ($bus) {
                $q->where('forth_bus_id', $bus->id)
                  ->orWhere('back_bus_id', $bus->id);
            })->with('guardian')->get();

        return $this->processStudentsToContacts($studentsViaBus);
    }

    private function processStudentsToContacts(\Illuminate\Support\Collection $students): \Illuminate\Support\Collection
    {
        $usersMap = [];
        $acceptLanguage = request()->header('Accept-Language') ?? '';
        $isEn = str_starts_with($acceptLanguage, 'en') || request()->input('lang') === 'en';

        foreach ($students as $student) {
            $guardianUser = $student->guardian->first(); // استخراج ولي الأمر الأول من الحزمة 
            if ($guardianUser) {
                $userId = $guardianUser->id;
                if (!isset($usersMap[$userId])) {
                    $usersMap[$userId] = clone $guardianUser;
                    $usersMap[$userId]->student_names = [];
                }
                $names = $usersMap[$userId]->student_names;
                $names[] = $student->full_name;
                $usersMap[$userId]->student_names = $names;
                $usersMap[$userId]->chat_description = $isEn
                    ? "Guardian of: " . implode(', ', array_unique($names))
                    : "ولي أمر: " . implode('، ', array_unique($names));
            }
        }
        return collect(array_values($usersMap));
    }

    // ═══════════════════════════════════════════════════════════
    //  2. getConversations — محادثات المستخدم المسموحة فقط
    // ═══════════════════════════════════════════════════════════

    public function getConversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::query();

        if ($user->role === 'admin') {
            // الأدمن يرى كل شيء
        } elseif ($user->role === 'school_admin') {
            // أدمن المدرسة يرى محادثات مدرسته
            $query->where('school_id', $user->getSchoolId());
        } else {
            // المستخدم العادي يرى محادثاته المسموحة فقط
            $validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
            $query = $user->conversations()
                ->whereHas('participants', function ($q) use ($user, $validContactIds) {
                    $q->where('users.id', '!=', $user->id)
                        ->whereIn('users.id', $validContactIds);
                });
        }

        $conversations = $query->with(['participants', 'lastMessage.sender', 'chatParticipants'])
            ->withMax('messages', 'created_at')
            ->orderByDesc('messages_max_created_at')
            ->paginate(20);

        return $this->success(
            ConversationResource::collection($conversations),
            $conversations
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  3. startConversation — بدء محادثة جديدة
    // ═══════════════════════════════════════════════════════════

    public function startConversation(Request $request): JsonResponse
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
        ]);

        $user = $request->user();
        $receiverId = $request->receiver_id;

        if ($user->id == $receiverId) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكنك بدء محادثة مع نفسك.',
            ], 422);
        }

        // الحماية: لا يمكنه التحدث إلا مع من هم مسموحون له (في نفس الباص الحالي)
        $validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
        if (!in_array($receiverId, $validContactIds)) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً لا يمكنك محادثة هذا المستخدم، لأنه لم يعد مرتبطاً بمسار الرحلة الحالي.',
            ], 403);
        }

        $conversation = Conversation::findBetween($user->id, $receiverId);

        if (! $conversation) {
            $receiver = User::findOrFail($receiverId);

            $conversation = DB::transaction(function () use ($user, $receiver, $receiverId) {
                $conv = Conversation::create([
                    'school_id' => $user->getSchoolId() ?? $receiver->getSchoolId(),
                    'type'      => 'private',
                ]);

                $conv->participants()->attach([
                    $user->id       => ['role' => $user->role],
                    $receiverId     => ['role' => $receiver->role],
                ]);

                return $conv;
            });
        }

        $conversation->load(['participants', 'lastMessage.sender', 'chatParticipants']);

        return $this->success(new ConversationResource($conversation));
    }

    // ═══════════════════════════════════════════════════════════
    //  4. sendMessage — إرسال رسالة
    // ═══════════════════════════════════════════════════════════

    public function sendMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $request->validate([
            'body'            => 'required|string|max:5000',
            'type'            => 'sometimes|in:text,image,file',
            'attachment_url'  => 'nullable|string|max:2048',
        ]);

        $user = $request->user();

        // التأكد أن المستخدم مشارك في المحادثة
        $isParticipant = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        if (! $isParticipant) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية الإرسال في هذه المحادثة.',
            ], 403);
        }

        // الحماية الإضافية: التأكد أن الطرف الآخر ما زال مسموحاً بالتحدث معه
        $otherParticipant = $conversation->participants()->where('users.id', '!=', $user->id)->first();
        if ($otherParticipant) {
            $validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
            if (!in_array($otherParticipant->id, $validContactIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكنك إرسال رسائل لهذه المحادثة، لأن الارتباط بمسار الرحلة قد انتهى.',
                ], 403);
            }
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id'       => $user->id,
            'body'            => $request->body,
            'type'            => $request->type ?? 'text',
            'attachment_url'  => $request->attachment_url,
        ]);

        // تحديث وقت المحادثة
        $message->conversation->touch();

        // تحديث وقت القراءة للمرسل (لأن إرسال الرسالة يعني أنه قرأ المحادثة)
        $conversation->chatParticipants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        // بث الرسالة عبر Reverb
        try {
            $broadcast = broadcast(new MessageSent($message))->toOthers();
            if (isset($broadcast)) {
                unset($broadcast);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Chat broadcast error: " . $e->getMessage());
        }

        // إرسال إشعار Push للمستلم
        try {
            $otherParticipant = $conversation->participants()
                ->where('users.id', '!=', $user->id)
                ->first();

            if ($otherParticipant) {
                $senderNameEn = $user->name_en ?: $user->name;
                $senderAvatarUrl = $user->avatar_url ?: url('/images/default_avatar.png');
                
                $messageText = $message->body ?: 'أرسل لك مرفقاً';
                $messageTextEn = $message->body ?: 'Sent you an attachment';
                
                $this->notificationService->sendTranslatedToUser(
                    userId: $otherParticipant->id,
                    type: 'chat_message',
                    titleKey: 'notifications.chat_message_title',
                    messageKey: 'notifications.chat_message_message',
                    translationParams: [
                        'name' => $user->name,
                        'message' => $messageText
                    ],
                    data: [
                        'conversation_id' => (string) $conversation->id,
                        'sender_id'       => (string) $user->id,
                        'sender_name'     => $user->name,
                        'sender_name_en'  => $senderNameEn,
                        'sender_avatar'   => $senderAvatarUrl,
                        'message_id'      => (string) $message->id,
                        'notification_id' => (string) $message->id, // For Flutter deduplication
                        'message'         => $messageText,
                        'message_en'      => $messageTextEn,
                        'click_action'    => 'FLUTTER_NOTIFICATION_CLICK',
                        'category'        => 'chat',
                        'target_screen'   => 'chat_details'
                    ],
                    translationParamsEn: [
                        'name' => $senderNameEn,
                        'message' => $messageTextEn
                    ]
                );
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('[FCM] Chat Notification Error: ' . $e->getMessage());
        }

        return $this->success(new MessageResource($message->load('sender')), null, 201);
    }

    // ═══════════════════════════════════════════════════════════
    //  5. getMessages — تاريخ الرسائل
    // ═══════════════════════════════════════════════════════════

    public function getMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // التأكد أن المستخدم مشارك (الأدمن مستثنى)
        $isAdmin = in_array($user->role, ['admin', 'school_admin']);
        $isParticipant = $conversation->participants()
            ->where('users.id', $user->id)
            ->exists();

        if (! $isParticipant && ! $isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية عرض هذه المحادثة.',
            ], 403);
        }

        // الحماية للطرفين (الأدمن مستثنى من حماية "انتهاء الرحلة" ليتمكن من المراجعة التاريخية)
        if (! $isAdmin) {
            $otherParticipant = $conversation->participants()->where('users.id', '!=', $user->id)->first();
            if ($otherParticipant) {
                $validContactIds = $this->getValidContactsList($user)->pluck('id')->toArray();
                if (!in_array($otherParticipant->id, $validContactIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'هذه المحادثة غير متاحة لأن الارتباط بمسار الرحلة قد انتهى.',
                    ], 403);
                }
            }
        }

        $messages = $conversation->messages()
            ->with('sender')
            ->orderByDesc('created_at')
            ->paginate(50);

        return $this->success(
            MessageResource::collection($messages),
            $messages
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  6. markAsRead — تحديث وقت القراءة
    // ═══════════════════════════════════════════════════════════

    public function markAsRead(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // 1. Update chat participant read time
        $conversation->chatParticipants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return $this->success(null, null, 200, 'تم تحديث القراءة.');
    }

    // ═══════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════

    private function success($data = null, $paginator = null, int $status = 200, string $message = null): JsonResponse
    {
        $response = ['success' => true];

        if ($message) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        // pagination meta
        if ($paginator) {
            $response['meta'] = [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ];
        }

        return response()->json($response, $status);
    }
}



