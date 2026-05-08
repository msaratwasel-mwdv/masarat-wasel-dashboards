<?php

namespace App\Observers;

use App\Models\Incident;
use App\Events\EmergencyReported;
use Illuminate\Support\Facades\Cache;

class IncidentObserver
{
    public function created(Incident $incident): void
    {
        $this->broadcastEmergency($incident);
    }

    public function updated(Incident $incident): void
    {
        if ($incident->isDirty('status')) {
            $this->broadcastEmergency($incident);
        }
    }

    protected function broadcastEmergency(Incident $incident): void
    {
        broadcast(new EmergencyReported($incident));
    }
}
