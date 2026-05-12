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
                'avatar_url' => $this->sender->avatar_url,
            ],
            'body'            => $this->body,
            'type'            => $this->type,
            'attachment_url'  => $this->attachment_url,
            'is_mine'         => (int)$this->sender_id === (int)$request->user()?->id,
            'created_at'      => $this->created_at->toISOString(),
        ];
    }
}


