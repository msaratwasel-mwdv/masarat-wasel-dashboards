<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $unreadCount = 0;

        if ($user) {
            // Count notifications from notification_recipients table
            $recipientUnread = \App\Models\NotificationRecipient::where('user_id', $user->id)
                ->whereIn('status', ['sent', 'pending'])
                ->count();

            // Count direct notifications
            $directUnread = \App\Models\Notification::where('user_id', $user->id)
                ->whereIn('status', ['sent', 'unread', 'pending'])
                ->count();

            $unreadCount = $recipientUnread + $directUnread;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->append('school') : null,
            ],
            'notifications_count' => $unreadCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'import_errors' => fn () => $request->session()->get('import_errors'),
                'success_count' => fn () => $request->session()->get('success_count'),
            ],
        ];
    }
}
