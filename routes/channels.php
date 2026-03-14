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

/**
 * قناة خاصة بمتابعة موقع الباص لحظياً
 */
Broadcast::channel('bus.{id}', function ($user, $id) {
    $bus = \App\Models\Bus::find($id);
    if (!$bus) return false;

    // السائق المسجل لهذا الباص
    if ((int) $bus->driver_id === (int) $user->id) return true;

    // أو ولي أمر لأحد الطلاب المسجلين في هذا الباص
    return \App\Models\Student::where('guardian_id', $user->id)
        ->where(function($q) use ($bus) {
            $q->whereHas('morningGroup', fn($g) => $g->where('bus_id', $bus->id))
              ->orWhereHas('afternoonGroup', fn($g) => $g->where('bus_id', $bus->id))
              ->orWhereHas('buses', fn($b) => $b->where('buses.id', $bus->id));
        })->exists();
});
