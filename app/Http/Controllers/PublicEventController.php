<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicEventController extends Controller
{
    public function index()
    {
        $events = Event::where('is_published', true)
            ->orderBy('event_date', 'desc')
            ->get();
            
        return Inertia::render('Events', [
            'events' => $events
        ]);
    }
}
