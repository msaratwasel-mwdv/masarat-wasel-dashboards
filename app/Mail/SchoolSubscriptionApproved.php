<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\School;

class SchoolSubscriptionApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $school;
    public $subscription;
    public $lang;

    public function __construct(School $school, $subscription)
    {
        $this->school = $school;
        $this->subscription = $subscription;
        $this->lang = $subscription->notes['preferred_lang'] ?? 'ar';
    }

    public function envelope(): Envelope
    {
        $subject = $this->lang === 'en' 
            ? 'Your school subscription has been approved - Masarat Wasel'
            : 'تمت الموافقة على اشتراك مدرستك - مسارات واصل';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.school.subscription_approved',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
