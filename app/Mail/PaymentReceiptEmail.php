<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\PaymentTransaction;
use App\Models\School;

class PaymentReceiptEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $transaction;
    public $school;
    public $remainingBalance;
    public $lang;

    public function __construct(PaymentTransaction $transaction, School $school, float $remainingBalance)
    {
        $this->transaction = $transaction;
        $this->school = $school;
        $this->remainingBalance = $remainingBalance;
        $subscription = $school->currentSubscription ?? $school->subscriptions()->latest()->first();
        $this->lang = $subscription ? ($subscription->notes['preferred_lang'] ?? 'ar') : 'ar';
    }

    public function envelope(): Envelope
    {
        $subject = $this->lang === 'en'
            ? 'Payment Receipt - Payment Received Successfully (Masarat Wasel)'
            : 'سند قبض - تم استلام دفعتكم بنجاح (مسارات واصل)';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.school.payment_receipt',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
