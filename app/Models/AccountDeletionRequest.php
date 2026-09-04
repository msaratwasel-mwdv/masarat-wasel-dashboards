<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountDeletionRequest extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'ticket_number',
        'name',
        'phone',
        'email',
        'app_name',
        'account_role',
        'school_name',
        'reason',
        'status',
        'ip_address',
        'user_agent',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $model): void {
            if (empty($model->ticket_number)) {
                $model->ticket_number = 'DEL-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));
            }
        });
    }
}
