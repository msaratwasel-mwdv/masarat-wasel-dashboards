<?php
  
namespace App\Jobs;

use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendFcmNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $fcmTokens;
    protected $title;
    protected $message;
    protected $data;
    protected $topic;
    protected $collapseKey;

    /**
     * Create a new job instance.
     */
    public function __construct(array $fcmTokens, string $title, string $message, array $data = [], ?string $topic = null, ?string $collapseKey = null)
    {
        $this->fcmTokens = $fcmTokens;
        $this->title = $title;
        $this->message = $message;
        $this->data = $data;
        $this->topic = $topic;
        $this->collapseKey = $collapseKey;
    }

    /**
     * Execute the job.
     */
    public function handle(NotificationService $notificationService): void
    {
        try {
            $notificationService->sendMulticast(
                fcmTokens: $this->fcmTokens,
                title: $this->title,
                message: $this->message,
                data: $this->data,
                topic: $this->topic,
                isQueued: true
            );
        } catch (\Throwable $e) {
            Log::error('[FCM Job] Failed to send notification', [
                'error' => $e->getMessage(),
                'tokens_count' => count($this->fcmTokens)
            ]);
            
            // Re-throw if we want to retry, but be careful with FCM limits
            // throw $e; 
        }
    }
}
