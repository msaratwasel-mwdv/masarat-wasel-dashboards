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

    public function handle(Request $request, \Closure $next)
    {
        $locale = null;

        if ($request->has('lang')) {
            $locale = $request->input('lang');
        } elseif ($request->hasCookie('locale')) {
            $locale = $request->cookie('locale');
        } elseif ($request->user() && $request->user()->preferred_language) {
            $locale = $request->user()->preferred_language;
        }

        if ($locale && in_array($locale, ['ar', 'en'])) {
            app()->setLocale($locale);
        }

        return parent::handle($request, $next);
    }

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
        $pendingLocationRequests = 0;
        $pendingAbsenceRequests = 0;
        $receivedIncidentsCount = 0;
        $pendingBusRequests = 0;
        $activeEmergenciesCount = 0;

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

            // Count pending items
            if ($user->school_id) {
                // School-specific counts
                $pendingLocationRequests = \Illuminate\Support\Facades\Cache::remember("school_{$user->school_id}_pending_locations_count", 10, function() use ($user) {
                    return \App\Models\StudentLocationRequest::where('school_id', $user->school_id)
                        ->where('status', 'pending')
                        ->count();
                });

                $pendingAbsenceRequests = \Illuminate\Support\Facades\Cache::remember("school_{$user->school_id}_pending_absence_count", 10, function() use ($user) {
                    return \App\Models\AbsenceRequest::whereHas('student', function($q) use ($user) {
                        $q->inSchool($user->school_id);
                    })->where('status', 'pending')->count();
                });

                // Received incidents (notifications specifically categorized as incidents or reports)
                $receivedIncidentsCount = \Illuminate\Support\Facades\Cache::remember("school_{$user->school_id}_received_incidents_count", 10, function() use ($user) {
                    return \App\Models\NotificationRecipient::where('user_id', $user->id)
                        ->where('status', 'sent')
                        ->count();
                });
            } elseif ($user->role === 'admin') {
                // System-wide counts for Super Admins
                $pendingLocationRequests = \Illuminate\Support\Facades\Cache::remember("global_pending_locations_count", 60, function() {
                    return \App\Models\StudentLocationRequest::where('status', 'pending')->count();
                });

                $pendingAbsenceRequests = \Illuminate\Support\Facades\Cache::remember("global_pending_absence_count", 60, function() {
                    return \App\Models\AbsenceRequest::where('status', 'pending')->count();
                });

                $receivedIncidentsCount = \Illuminate\Support\Facades\Cache::remember("admin_{$user->id}_received_incidents_count", 60, function() use ($user) {
                    return \App\Models\NotificationRecipient::where('user_id', $user->id)
                        ->where('status', 'sent')
                        ->count();
                });

                $pendingBusRequests = \Illuminate\Support\Facades\Cache::remember("global_pending_bus_requests_count", 60, function() {
                    return \App\Models\BusRequest::where('status', 'pending')->count();
                });

                $activeEmergenciesCount = \Illuminate\Support\Facades\Cache::remember("global_active_emergencies_count", 60, function() {
                    return \App\Models\Incident::whereIn('status', ['active', 'pending', 'in_progress'])->count();
                });
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? $user->append('school') : null,
            ],
            'notifications_count' => $unreadCount,
            'pending_location_requests_count' => $pendingLocationRequests,
            'pending_absence_requests_count' => $pendingAbsenceRequests,
            'received_incidents_count' => $receivedIncidentsCount,
            'pending_bus_requests_count' => $pendingBusRequests,
            'active_emergencies_count' => $activeEmergenciesCount,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'import_errors' => fn () => $request->session()->get('import_errors'),
                'success_count' => fn () => $request->session()->get('success_count'),
            ],
        ];
    }
}
