<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class ChatSimulatorController extends Controller
{
    public function index()
    {
        // نستدعي التوكنات من الكاش الذي خزنها الـ Seeder
        $demoData = Cache::get('simulator_tokens');

        return Inertia::render('Admin/ChatSimulator', [
            'demoData' => $demoData,
            'appUrl'   => config('app.url'),
        ]);
    }
}
