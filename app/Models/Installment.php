<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'subscription_id',
        'installment_number',
        'amount',
        'paid_amount',
        'due_date',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'installment_number' => 'integer',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function installmentPayments()
    {
        return $this->hasMany(InstallmentPayment::class);
    }

    public function payments()
    {
        return $this->hasManyThrough(
            PaymentTransaction::class,
            InstallmentPayment::class,
            'installment_id',
            'id',
            'id',
            'payment_transaction_id'
        );
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue')->orWhere(function($q) {
            $q->whereIn('status', ['pending', 'partially_paid'])->where('due_date', '<', now()->toDateString());
        });
    }

    public function getRemainingAmountAttribute()
    {
        return max(0, $this->amount - $this->paid_amount);
    }
}
