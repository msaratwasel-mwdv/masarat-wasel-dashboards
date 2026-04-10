<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load('sender');
    }

    /**
     * القناة الخاصة بالمحادثة
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.conversation.' . $this->message->conversation_id),
        ];
    }

    /**
     * اسم الحدث المُرسَل
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * البيانات المُرسَلة للعميل (Flutter)
     */
    public function broadcastWith(): array
    {
        return (new MessageResource($this->message))->resolve();
    }
}


