<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'type',
        'title',
    ];

    /**
     * المدرسة التي تنتمي إليها المحادثة
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * المشاركون في المحادثة
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_participants')
            ->withPivot('role', 'last_read_at')
            ->withTimestamps();
    }

    /**
     * سجلات المشاركة (للوصول إلى pivot model مباشرة)
     */
    public function chatParticipants(): HasMany
    {
        return $this->hasMany(ChatParticipant::class);
    }

    /**
     * جميع الرسائل في المحادثة
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * آخر رسالة في المحادثة
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * البحث عن محادثة موجودة بين مستخدمَين بالضبط (private)
     */
    public static function findBetween(int $userA, int $userB): ?self
    {
        return static::where('type', 'private')
            ->whereHas('participants', fn($q) => $q->where('users.id', $userA))
            ->whereHas('participants', fn($q) => $q->where('users.id', $userB))
            ->withCount('participants')
            ->having('participants_count', 2)
            ->first();
    }
}


