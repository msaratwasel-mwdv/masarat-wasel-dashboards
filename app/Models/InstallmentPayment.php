<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstallmentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_transaction_id',
        'installment_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function paymentTransaction()
    {
        return $this->belongsTo(PaymentTransaction::class);
    }

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }
}
