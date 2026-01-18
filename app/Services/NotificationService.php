<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Send a notification to a single user.
     */
    public function sendToUser(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'from_user_name' => $fromUserName,
            'status' => 'unread',
        ]);
    }

    /**
     * Send a notification to multiple users.
     */
    public function sendToUsers(
        array $userIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $notifications = collect();
        
        foreach ($userIds as $userId) {
            $notifications->push(
                $this->sendToUser($userId, $type, $title, $message, $data, $fromUserName)
            );
        }
        
        return $notifications;
    }

    /**
     * Send notification to all drivers of specific buses.
     */
    public function notifyBusDrivers(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $driverIds = \DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('driver_id')
            ->pluck('driver_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($driverIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * Send notification to all supervisors of specific buses.
     */
    public function notifyBusSupervisors(
        array $busIds,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $supervisorIds = \DB::table('buses')
            ->whereIn('id', $busIds)
            ->whereNotNull('supervisor_id')
            ->pluck('supervisor_id')
            ->unique()
            ->toArray();

        return $this->sendToUsers($supervisorIds, $type, $title, $message, $data, $fromUserName);
    }

    /**
     * Send notification to company admins.
     */
    public function notifyCompanyAdmins(
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $fromUserName = null
    ): Collection {
        $adminIds = User::where('role', 'admin')
            ->pluck('id')
            ->toArray();

        return $this->sendToUsers($adminIds, $type, $title, $message, $data, $fromUserName);
    }
}
