<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\School;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SubscriptionPageController extends Controller
{
    public function index()
    {
        return Inertia::render('Subscription', [
            'plans' => Plan::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    /**
     * STEP 1 — School submits an inquiry.
     * No account is created yet. The request is saved as a "pending_approval" subscription
     * so the admin can review, price it, and then create the actual credentials.
     *
     * Correct B2B Flow:
     * 1. School fills form (contact info + preferred plan + student count)
     * 2. System saves the request → subscription status = 'pending_approval'
     * 3. Admin reviews the request in their dashboard
     * 4. Admin contacts the school, sets final price, creates credentials
     * 5. Admin approves → system sends welcome email with credentials
     * 6. School logs in and fills their data (students, buses, drivers...)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // School Identity
            'school_ar' => 'required|string|max:255',
            'school_en' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'district' => 'required|string|max:255',

            // Contact Person
            'admin_name' => 'required|string|max:255',
            'admin_name_en' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|max:20|unique:users,phone',
            'language' => 'required|in:ar,en',

            // Subscription Preferences
            'plan_id' => 'required|exists:plans,id',
            'billing_type' => 'required|in:monthly,yearly',
            'student_count' => 'required|integer|min:20|max:5000',
            'bus_count' => 'nullable|integer|min:0|max:500',

            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if this email already submitted a request
        if (School::where('contact_email', $validated['email'])->exists()
            || User::where('email', $validated['email'])->exists()) {
            return back()->withErrors([
                'email' => __('هذا البريد الإلكتروني مسجل بالفعل في النظام. تواصل مع الدعم الفني.'),
            ]);
        }

        try {
            DB::beginTransaction();

            // 1. Create the school record (inactive until admin approves)
            $school = School::create([
                'name' => $validated['school_ar'],
                'name_en' => $validated['school_en'] ?? $validated['school_ar'],
                'address' => $validated['city'].' - '.$validated['district'],
                'city' => $validated['city'],
                'is_active' => false, // Inactive until admin approves!
                'contact_email' => $validated['email'],
                'contact_phone' => $validated['phone'],
            ]);

            // 2. Create the User (School Admin) immediately
            [$firstAr, $secondAr, $thirdAr, $lastAr] = User::parseFullName($validated['admin_name']);
            [$firstEn, $secondEn, $thirdEn, $lastEn] = User::parseFullName($validated['admin_name_en']);

            $adminUser = User::create([
                'first_name_ar' => $firstAr,
                'last_name_ar' => $lastAr,
                'first_name_en' => $firstEn,
                'last_name_en' => $lastEn,
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'national_id' => 'SCH-'.time(), // Temporary filler if required
            ]);

            // Assign role
            $role = \App\Models\Role::where('name', 'school_admin')->first();
            if ($role) {
                $adminUser->roles()->attach($role->id);
            }

            // Link to school
            \App\Models\SchoolAdmin::create([
                'user_id' => $adminUser->id,
                'school_id' => $school->id,
            ]);

            // 3. Create a "pending" subscription (no installments yet — admin sets price later)
            $subscription = Subscription::create([
                'school_id' => $school->id,
                'plan_id' => $validated['plan_id'],
                'status' => 'pending_approval',
                'start_date' => now()->toDateString(),
                'end_date' => now()->addYear()->toDateString(),
                // Store the inquiry metadata in notes
                'notes' => [
                    'billing_type' => $validated['billing_type'],
                    'student_count' => $validated['student_count'],
                    'bus_count' => $validated['bus_count'] ?? 0,
                    'custom_notes' => $validated['notes'] ?? '',
                    'preferred_lang' => $validated['language'],
                ],
            ]);

            DB::commit();

            // 3. Log for admin awareness (will become a notification later)
            Log::info("📩 New Subscription Request: School '{$validated['school_ar']}' — {$validated['student_count']} students. Email: {$validated['email']}");

            return to_route('subscription')->with('success', true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Subscription request failed: '.$e->getMessage());

            return back()->withErrors([
                'message' => 'حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى.',
            ]);
        }
    }
}
