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

    public function __construct(PaymentTransaction $transaction, School $school, float $remainingBalance)
    {
        $this->transaction = $transaction;
        $this->school = $school;
        $this->remainingBalance = $remainingBalance;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'سند قبض - تم استلام دفعتكم بنجاح (مسارات واصل)',
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
