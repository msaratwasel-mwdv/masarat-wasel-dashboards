<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * قناة خاصة بالمحادثة — فقط المشاركون يمكنهم الاستماع
 */
Broadcast::channel('chat.conversation.{conversationId}', function ($user, $conversationId) {
    return $user->conversations()->where('conversations.id', $conversationId)->exists();
});

/**
 * قناة خاصة بولي الأمر — لاستقبال تحديثات حالة الطلاب فورياً
 */
Broadcast::channel('guardian.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
