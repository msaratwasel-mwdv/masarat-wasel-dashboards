<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AssistantController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = Auth::user()->school_id;
        $search = $request->input('search');

        $assistants = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))
            ->whereHas('assignedBusAsAssistant', fn($q) => $q->where('school_id', $schoolId))
            ->with(['assistant', 'assignedBusAsAssistant'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->get()
            ->map(function ($assistant) {
                return [
                    'id' => $assistant->id,
                    'name' => $assistant->name,
                    'name_en' => $assistant->name_en,
                    'national_id' => $assistant->national_id,
                    'phone' => $assistant->phone,
                    'email' => $assistant->email,
                    'emergency_contact_name' => $assistant->assistant?->emergency_contact_name,
                    'emergency_contact_phone' => $assistant->assistant?->emergency_contact_phone,
                    'status' => $assistant->assistant?->status,
                    'bus_number' => $assistant->assignedBusAsAssistant?->bus_number,
                    'plate_number' => $assistant->assignedBusAsAssistant?->plate_number,
                    'image' => $assistant->image,
                ];
            });

        return Inertia::render('School/Assistants/Index', [
            'assistants' => $assistants,
            'filters' => $request->only(['search']),
        ]);
    }
}
