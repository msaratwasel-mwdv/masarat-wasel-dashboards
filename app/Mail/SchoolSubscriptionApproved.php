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

    public function __construct(School $school)
    {
        $this->school = $school;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'تمت الموافقة على اشتراك مدرستك - مسارات واصل',
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
