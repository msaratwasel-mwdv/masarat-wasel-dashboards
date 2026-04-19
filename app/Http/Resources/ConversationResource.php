<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        // عدد الرسائل غير المقروءة
        $participant = $this->chatParticipants->where('user_id', $user?->id)->first();
        $unreadCount = 0;

        if ($participant) {
            $query = $this->messages()->where('sender_id', '!=', $user->id);
            if ($participant->last_read_at) {
                $query->where('created_at', '>', $participant->last_read_at);
            }
            $unreadCount = $query->count();
        }

        // الطرف الآخر في المحادثة الخاصة
        $otherParticipants = $this->participants->where('id', '!=', $user?->id);

        return [
            'id'           => $this->id,
            'type'         => $this->type,
            'title'        => $this->title,
            'participants' => $otherParticipants->map(fn($p) => [
                'id'     => $p->id,
                'name'   => $p->name,
                'role'   => $p->role,
                'avatar' => $p->image
                    ? (str_starts_with($p->image, 'http')
                        ? $p->image
                        : asset('storage/' . ltrim($p->image, '/')))
                    : null,
            ])->values(),
            'last_message' => $this->whenLoaded('lastMessage', function () {
                return [
                    'id'         => $this->lastMessage->id,
                    'body'       => $this->lastMessage->body,
                    'sender_id'  => $this->lastMessage->sender_id,
                    'created_at' => $this->lastMessage->created_at->toISOString(),
                ];
            }),
            'unread_count' => $unreadCount,
            'updated_at'   => $this->updated_at->toISOString(),
        ];
    }
}
