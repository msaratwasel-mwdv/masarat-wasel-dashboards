<?php

namespace App\Observers;

use App\Models\FieldTrip;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class FieldTripObserver
{
    /**
     * Handle the FieldTrip "created" event.
     */
    public function created(FieldTrip $fieldTrip): void
    {
        if ($fieldTrip->bus_id && $fieldTrip->status === 'approved') {
            $this->notifyCrew($fieldTrip);
        }
    }

    /**
     * Handle the FieldTrip "updated" event.
     */
    public function updated(FieldTrip $fieldTrip): void
    {
        // If bus_id was set/changed and is not null, or if status changed to approved and we have a bus
        $busChanged = $fieldTrip->wasChanged('bus_id') && $fieldTrip->bus_id;
        $statusApproved = $fieldTrip->wasChanged('status') && $fieldTrip->status === 'approved' && $fieldTrip->bus_id;

        if ($busChanged || $statusApproved) {
            $this->notifyCrew($fieldTrip);
        }
    }

    /**
     * Send notification to the bus crew.
     */
    protected function notifyCrew(FieldTrip $fieldTrip): void
    {
        try {
            $dateStr = $fieldTrip->date instanceof \Carbon\Carbon ? $fieldTrip->date->toDateString() : $fieldTrip->date;

            $notificationService = app(NotificationService::class);
            $notificationService->notifyBusCrew(
                busId: $fieldTrip->bus_id,
                type: 'field_trip_assigned',
                title: '🚌 رحلة ميدانية جديدة',
                message: "تم إسناد رحلة ميدانية جديدة لحافلتك: {$fieldTrip->name} بتاريخ {$dateStr}",
                data: [
                    'field_trip_id' => (string) $fieldTrip->id,
                    'category' => 'field_trips',
                    'target_screen' => 'field_trip_details',
                ],
                titleEn: '🚌 New Field Trip Assigned',
                messageEn: "A new field trip has been assigned to your bus: {$fieldTrip->name} on {$dateStr}"
            );
        } catch (\Exception $e) {
            Log::error('FieldTripObserver notification failed: '.$e->getMessage());
        }
    }
}
