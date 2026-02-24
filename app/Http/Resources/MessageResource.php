<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender'          => [
                'id'   => $this->sender->id,
                'name' => $this->sender->name,
                'role' => $this->sender->role,
            ],
            'body'            => $this->body,
            'type'            => $this->type,
            'attachment_url'  => $this->attachment_url,
            'is_mine'         => $this->sender_id === $request->user()?->id,
            'created_at'      => $this->created_at->toISOString(),
        ];
    }
}
