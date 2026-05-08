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
                    'first_name_ar' => $assistant->first_name_ar,
                    'second_name_ar' => $assistant->second_name_ar,
                    'third_name_ar' => $assistant->third_name_ar,
                    'last_name_ar' => $assistant->last_name_ar,
                    'first_name_en' => $assistant->first_name_en,
                    'second_name_en' => $assistant->second_name_en,
                    'third_name_en' => $assistant->third_name_en,
                    'last_name_en' => $assistant->last_name_en,
                    'address' => $assistant->address,
                    'id_card_front_image' => $assistant->assistant?->id_card_front_image,
                    'id_card_back_image' => $assistant->assistant?->id_card_back_image,
                    'assistant' => $assistant->assistant,
                ];
            });

        return Inertia::render('School/Assistants/Index', [
            'assistants' => $assistants,
            'filters' => $request->only(['search']),
        ]);
    }

    public function update(Request $request, User $assistant)
    {
        $schoolId = Auth::user()->school_id;
        $isAssigned = $assistant->assignedBusAsAssistant()->where('school_id', $schoolId)->exists();
        if (!$isAssigned) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'first_name_ar' => 'required|string|max:255',
            'second_name_ar' => 'nullable|string|max:255',
            'third_name_ar' => 'nullable|string|max:255',
            'last_name_ar' => 'required|string|max:255',
            'first_name_en' => 'nullable|string|max:255',
            'second_name_en' => 'nullable|string|max:255',
            'third_name_en' => 'nullable|string|max:255',
            'last_name_en' => 'nullable|string|max:255',
            'national_id' => ['required', 'numeric', \Illuminate\Validation\Rule::unique('users')->ignore($assistant->id)],
            'email' => ['required', 'email', \Illuminate\Validation\Rule::unique('users')->ignore($assistant->id)],
            'phone' => ['required', \Illuminate\Validation\Rule::unique('users')->ignore($assistant->id)],
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'id_card_back_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'emergency_contact_name' => 'required|string',
            'emergency_contact_phone' => 'required|string',
            'status' => 'required|in:active,inactive',
            'address' => 'nullable|string|max:500',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $assistant) {
            $data = [
                'first_name_ar' => $request->first_name_ar,
                'second_name_ar' => $request->second_name_ar ?? '',
                'third_name_ar' => $request->third_name_ar ?? '',
                'last_name_ar' => $request->last_name_ar,
                'first_name_en' => $request->first_name_en ?? '',
                'second_name_en' => $request->second_name_en ?? '',
                'third_name_en' => $request->third_name_en ?? '',
                'last_name_en' => $request->last_name_en ?? '',
                'national_id' => $request->national_id,
                'email' => $request->email,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            if ($request->hasFile('image')) {
                if ($assistant->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistant->image);
                }
                $data['image'] = $request->file('image')->store('avatars', 'public');
            }

            $assistant->update($data);

            $assistantExtData = [
                'status' => strtolower($request->status ?? 'active'),
                'emergency_contact_name' => $request->emergency_contact_name,
                'emergency_contact_phone' => $request->emergency_contact_phone,
            ];

            $assistantExtRecord = $assistant->assistant()->firstOrCreate(['user_id' => $assistant->id]);

            if ($request->hasFile('id_card_front_image')) {
                if ($assistantExtRecord->id_card_front_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistantExtRecord->id_card_front_image);
                }
                $assistantExtData['id_card_front_image'] = $request->file('id_card_front_image')->store('assistants/id_cards', 'public');
            }

            if ($request->hasFile('id_card_back_image')) {
                if ($assistantExtRecord->id_card_back_image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($assistantExtRecord->id_card_back_image);
                }
                $assistantExtData['id_card_back_image'] = $request->file('id_card_back_image')->store('assistants/id_cards', 'public');
            }

            $assistant->assistant()->updateOrCreate(
                ['user_id' => $assistant->id],
                $assistantExtData
            );
        });

        return redirect()->back()->with('success', 'Assistant updated successfully');
    }
}
