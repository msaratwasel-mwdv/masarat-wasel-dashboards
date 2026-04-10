<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Prunable;

class Message extends Model
{
    use HasFactory, SoftDeletes, Prunable;

    /**
     * تحديد الرسائل القديمة (عمرها شهر) للحذف النهائي من قواعد البيانات
     */
    public function prunable()
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'type',
        'attachment_url',
    ];

    /**
     * المحادثة التي تنتمي إليها الرسالة
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * المرسِل
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}


