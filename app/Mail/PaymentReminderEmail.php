<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Installment;

class PaymentReminderEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $installment;
    public $isOverdue;
    public $lang;

    public function __construct(Installment $installment, bool $isOverdue = false)
    {
        $this->installment = $installment;
        $this->isOverdue = $isOverdue;
        $subscription = $installment->subscription;
        $this->lang = $subscription ? ($subscription->notes['preferred_lang'] ?? 'ar') : 'ar';
    }

    public function envelope(): Envelope
    {
        if ($this->lang === 'en') {
            $subject = $this->isOverdue 
                ? 'Alert: Overdue Payment Installment (Masarat Wasel)'
                : 'Reminder: Upcoming Payment Installment (Masarat Wasel)';
        } else {
            $subject = $this->isOverdue 
                ? 'تنبيه: تأخر سداد الدفعة المالية (مسارات واصل)'
                : 'تذكير: اقتراب موعد سداد الدفعة المالية (مسارات واصل)';
        }

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.school.payment_reminder',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
