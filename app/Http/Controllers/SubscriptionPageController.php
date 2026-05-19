<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Plan;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\SubscriptionService;

class SubscriptionPageController extends Controller
{
    public function index()
    {
        return Inertia::render('Subscription', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get()
        ]);
    }

    public function store(Request $request, SubscriptionService $subscriptionService)
    {
        $validated = $request->validate([
            // User Data
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            
            // School Data
            'school_ar' => 'required|string|max:255',
            'school_en' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            'admin_name_en' => 'required|string|max:255',
            
            // Contact Data
            'phone' => 'required|string|max:20',
            'language' => 'required|in:ar,en',
            
            // Plan Data
            'plan_id' => 'required|exists:plans,id',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // Create School (Starts empty/inactive essentially)
            $school = School::create([
                'name' => $validated['school_ar'],
                'address' => $validated['city'] . ' - ' . $validated['district'],
                'is_active' => true, 
            ]);

            // Parse name parts
            [$firstNameAr, $secondNameAr, $thirdNameAr, $lastNameAr] = User::parseFullName($validated['admin_name']);
            [$firstNameEn, $secondNameEn, $thirdNameEn, $lastNameEn] = User::parseFullName($validated['admin_name_en']);

            // Create User
            $user = User::create([
                'first_name_ar' => $firstNameAr,
                'last_name_ar' => $lastNameAr,
                'first_name_en' => $firstNameEn,
                'last_name_en' => $lastNameEn,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'],
                'national_id' => 'TMP-' . time(),
            ]);

            // Assign Role
            $role = \App\Models\Role::where('name', 'school_admin')->first();
            if ($role) {
                $user->roles()->attach($role->id);
            }

            // Create School Admin Link
            \App\Models\SchoolAdmin::create([
                'user_id' => $user->id,
                'school_id' => $school->id,
            ]);

            // Assign Plan (Creates pending_approval subscription)
            $subscriptionService->assignPlanToSchool($school->id, $validated['plan_id']);

            // Save notes if any (Currently no place to save notes cleanly, we can log it)
            if ($validated['notes']) {
                // Later could add to 'notes' table
                \Log::info("Subscription Notes from {$validated['school_ar']}: {$validated['notes']}");
            }

            DB::commit();

            return to_route('subscription')->with('success', 'تم تقديم الطلب بنجاح');

        } catch (\Exception $e) {
            DB::rollBack();
            return to_route('subscription')->withErrors(['message' => 'حدث خطأ: ' . $e->getMessage()]);
        }
    }
}
