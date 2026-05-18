<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'name_en' => $this->name_en ?? $this->name,
            'role'  => $this->role,
            'phone' => $this->phone,
            'chat_description' => $this->chat_description ?? null,
            'avatar_url' => $this->avatar_url,
        ];
    }
}
