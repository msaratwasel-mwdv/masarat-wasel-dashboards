<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeacherController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $teachers = User::query()
            ->where('school_id', $user->school_id)
            ->where('role', 'teacher')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('School/Teachers/Index', [
            'teachers' => $teachers,
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:50', Rule::unique('users', 'phone')],
            'password' => 'required|string|min:6',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'teacher',
            'school_id' => $user->school_id,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Teacher created successfully.');
    }
}
