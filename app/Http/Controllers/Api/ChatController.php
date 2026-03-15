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

class ChatController extends Controller
{
    public function __construct(protected NotificationService $notificationService) {}
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
        $contacts = collect();

        switch ($user->role) {
            case 'parent':
                // طلاب ولي الأمر الناشطين
                $myStudents = $user->students()->where('is_active', true)->with(['supervisor'])->get();
                if ($myStudents->isEmpty()) return collect();

                $busesMap = [];
                $directStaffMap = [];

                foreach ($myStudents as $student) {
                    // 1. التعامل مع المشرف/المعلم المرتبط بالطالب مباشرة
                    if ($student->supervisor) {
                        $sId = $student->supervisor->id;
                        if (!isset($directStaffMap[$sId])) {
                            $directStaffMap[$sId] = [
                                'user' => clone $student->supervisor,
                                'student_names' => []
                            ];
                        }
                        $directStaffMap[$sId]['student_names'][] = $student->full_name;
                    }

                    // 2. التعامل مع باصات الطالب
                    $studentBuses = collect();

                    // - من خلال الربط المباشر بالباص
                    foreach ($student->buses()->wherePivot('is_active', true)->get() as $bus) {
                        $studentBuses->push($bus);
                    }

                    // - من خلال المجموعات
                    if ($student->morningGroup && $student->morningGroup->bus) {
                        $studentBuses->push($student->morningGroup->bus);
                    }
                    if ($student->afternoonGroup && $student->afternoonGroup->bus) {
                        $studentBuses->push($student->afternoonGroup->bus);
                    }

                    foreach ($studentBuses->unique('id') as $bus) {
                        if (!isset($busesMap[$bus->id])) {
                            $busesMap[$bus->id] = [
                                'bus' => $bus,
                                'student_names' => []
                            ];
                        }
                        $busesMap[$bus->id]['student_names'][] = $student->full_name;
                    }
                }

                // إضافة الموظفين المرتبطين مباشرة
                foreach ($directStaffMap as $staffData) {
                    $staff = $staffData['user'];
                    $names = implode('، ', array_unique($staffData['student_names']));
                    $staff->chat_description = "معلم/مشرف مسار - الطالب: " . $names;
                    $contacts->push($staff);
                }

                // إضافة موظفي الباصات
                foreach ($busesMap as $busData) {
                    $bus = $busData['bus'];
                    $studentsNames = implode('، ', array_unique($busData['student_names']));

                    if ($bus->driver) {
                        $driver = clone $bus->driver;
                        $driver->chat_description = "سائق مسار - الطالب: " . $studentsNames;
                        $contacts->push($driver);
                    }
                    if ($bus->supervisor) {
                        $supervisor = clone $bus->supervisor;
                        $supervisor->chat_description = "مشرفة مسار - الطالب: " . $studentsNames;
                        $contacts->push($supervisor);
                    }
                }
                break;

            case 'driver':
                $bus = Bus::where('driver_id', $user->id)->first();
                if ($bus) {
                    $contacts = $contacts->merge($this->getGuardianUsersForBus($bus));
                }
                break;

            case 'supervisor':
            case 'teacher':
                // 1. من خلال الباص (كل الطلاب في الباص)
                $bus = Bus::where('supervisor_id', $user->id)->first();
                if ($bus) {
                    $contacts = $contacts->merge($this->getGuardianUsersForBus($bus));
                }

                // 2. من خلال الطلاب المرتبطين به مباشرة (في جدول الطلاب)
                $directStudents = \App\Models\Student::where('supervisor_id', $user->id)
                    ->where('is_active', true)
                    ->with('guardian')
                    ->get();
                if ($directStudents->isNotEmpty()) {
                    $contacts = $contacts->merge($this->processStudentsToContacts($directStudents));
                }
                break;

            case 'field_supervisor':
                // مشرف ميداني يرى جميع سائقي ومشرفي الحافلات النشطين
                $staff = User::whereIn('role', ['driver', 'supervisor'])
                    ->where('is_active', true)
                    ->get();
                foreach($staff as $contact) {
                    $contact->chat_description = "موظف حافلة - " . ($contact->role === 'driver' ? 'سائق' : 'مشرف');
                    $contacts->push($contact);
                }
                break;

            case 'admin':
                // الأدمن العام يرى جميع المستخدمين
                $contacts = User::where('id', '!=', $user->id)->get();
                foreach($contacts as $contact) {
                    $contact->chat_description = "مستخدم النظام - دور: " . $contact->role;
                }
                break;

            case 'school_admin':
                // أدمن المدرسة يرى مستخدمي مدرسته فقط
                $contacts = User::where('school_id', $user->school_id)
                    ->where('id', '!=', $user->id)
                    ->get();
                foreach($contacts as $contact) {
                    $contact->chat_description = "موظف/ولي أمر في المدرسة";
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
        // 1. Students via legacy/override pivot
        $studentsViaPivot = $bus->students()->wherePivot('is_active', true)->with('guardian')->get();

        // 2. Students via groups
        $groupIds = $bus->groups()->pluck('id')->toArray();
        $studentsViaGroups = \App\Models\Student::where(function ($q) use ($groupIds) {
            $q->whereIn('morning_group_id', $groupIds)
                ->orWhereIn('afternoon_group_id', $groupIds);
        })->where('is_active', true)->with('guardian')->get();

        $allStudents = $studentsViaPivot->merge($studentsViaGroups)->unique('id');

        return $this->processStudentsToContacts($allStudents);
    }

    private function processStudentsToContacts(\Illuminate\Support\Collection $students): \Illuminate\Support\Collection
    {
        $usersMap = [];

        foreach ($students as $student) {
            $guardianUser = $student->guardian; // هذا الآن User مباشرة
            if ($guardianUser) {
                $userId = $guardianUser->id;
                if (!isset($usersMap[$userId])) {
                    $usersMap[$userId] = clone $guardianUser;
                    $usersMap[$userId]->student_names = [];
                }
                $names = $usersMap[$userId]->student_names;
                $names[] = $student->full_name;
                $usersMap[$userId]->student_names = $names;
                $usersMap[$userId]->chat_description = "ولي أمر: " . implode('، ', array_unique($names));
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
            $query->where('school_id', $user->school_id);
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

            $conversation = Conversation::create([
                'school_id' => $user->school_id ?? $receiver->school_id,
                'type'      => 'private',
            ]);

            $conversation->participants()->attach([
                $user->id       => ['role' => $user->role],
                $receiverId     => ['role' => $receiver->role],
            ]);
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
                $this->notificationService->sendToUser(
                    userId: $otherParticipant->id,
                    type: 'new_message',
                    title: 'رسالة جديدة من ' . $user->name,
                    message: $message->body ?: 'أرسل لك مرفقاً',
                    data: [
                        'conversation_id' => (string) $conversation->id,
                        'sender_id'       => (string) $user->id,
                        'sender_name'     => $user->name,
                    ],
                    fromUserName: $user->name
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
