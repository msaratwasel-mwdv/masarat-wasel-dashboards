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
            // Cache the unread count for 2 minutes to avoid hitting DB on every single request
            $unreadCount = \Illuminate\Support\Facades\Cache::remember("user_{$user->id}_notifications_count", 120, function() use ($user) {
                return \Illuminate\Support\Facades\DB::table(
                    \Illuminate\Support\Facades\DB::raw('(
                        SELECT id FROM notification_recipients 
                        WHERE user_id = ? AND status IN (\'sent\', \'pending\')
                        UNION ALL
                        SELECT id FROM notifications 
                        WHERE user_id = ? AND status IN (\'sent\', \'unread\', \'pending\')
                    ) AS combined')
                )
                ->setBindings([$user->id, $user->id])
                ->count();
            });

            // Pre-load relationships needed for school resolution + role (avoids N+1)
            if (!$user->relationLoaded('roles')) {
                $user->load('roles');
            }
            // Load the school-resolving relationship based on the user's role
            // Admin users don't belong to any school — skip entirely
            $role = $user->role;
            if ($role === 'admin') {
                // No school resolution needed for admins
            } elseif ($role === 'school_admin' && !$user->relationLoaded('schoolAdmin')) {
                $user->load('schoolAdmin');
            } elseif ($role === 'teacher' && !$user->relationLoaded('teacher')) {
                $user->load('teacher');
            } elseif ($role === 'driver' && !$user->relationLoaded('assignedBus')) {
                $user->load('assignedBus');
            } elseif ($role === 'assistant' && !$user->relationLoaded('assignedBusAsAssistant')) {
                $user->load('assignedBusAsAssistant');
            } elseif ($role === 'field_supervisor' && !$user->relationLoaded('assignedBusAsFieldSupervisor')) {
                $user->load('assignedBusAsFieldSupervisor');
            }
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
