<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Bus;
use App\Models\SupervisorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SupervisorController extends Controller
{
    /**
     * عرض قائمة المشرفين (مع بحث)
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $search = $request->input('search');

        $supervisors = User::query()
            ->atSchool($user->school_id)
            ->withRole('supervisor')
            ->with(['supervisorProfile']) // نجلب بيانات البروفايل
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name_ar', 'like', "%{$search}%")
                        ->orWhere('last_name_ar', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($supervisor) {
                // نبحث عن الباص الذي يشرف عليه (إن وجد)
                $bus = Bus::where('supervisor_id', $supervisor->id)->first();
                $profile = $supervisor->supervisorProfile;

                return [
                    'id' => $supervisor->id,
                    'name' => $supervisor->name,
                    'name_en' => $supervisor->name_en,
                    'user_code' => $supervisor->user_code,
                    'national_id' => $supervisor->national_id,
                    'email' => $supervisor->email,
                    'phone' => $supervisor->phone,
                    'address' => $supervisor->address,
                    'preferred_language' => $supervisor->preferred_language,
                    'is_active' => (bool)$supervisor->is_active,
                    'image' => $supervisor->image,
                    
                    // بيانات البروفايل
                    'supervisor_type' => $profile ? $profile->supervisor_type : 'bus', // افتراضي
                    'tracking_type' => $profile ? $profile->tracking_type : 'phone', // افتراضي
                    
                    // الباص المرتبط
                    'bus_id' => $bus ? $bus->id : null,
                    'bus_number' => $bus ? $bus->bus_number : null,
                ];
            });

        // جلب قائمة الباصات لاستخدامها في المودل
        $buses = Bus::where('school_id', $user->school_id)->get(['id', 'bus_number', 'plate_number']);

        return Inertia::render('School/Supervisors/Index', [
            'supervisors' => $supervisors,
            'buses' => $buses,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * إنشاء مشرف جديد
     */
    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => ['required', 'string', 'max:20', Rule::unique('users', 'national_id')],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')],
            'address' => 'nullable|string|max:500',
            'preferred_language' => 'nullable|in:ar,en',
            'password' => 'nullable|string|min:6',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            
            // حقول المشرف
            'supervisor_type' => 'required|in:bus,class,both',
            'tracking_type' => 'required|in:phone,vehicle',
            'status' => 'nullable|in:Trainee,Active,On Leave,Inactive',
            'is_active' => 'required|boolean',
            'bus_id' => 'nullable|exists:buses,id',
        ]);

        DB::beginTransaction();
        try {
            // رفع الصورة إن وجدت
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('users', 'public');
            }

            // Split names
            $nameParts = User::parseFullName($validated['name']);
            $enNameParts = User::parseFullName($validated['name_en'] ?? '');

            // إنشاء المستخدم
            $newSupervisor = User::create([
                'first_name_ar' => $nameParts[0],
                'second_name_ar' => $nameParts[1],
                'third_name_ar' => $nameParts[2],
                'last_name_ar' => $nameParts[3],
                'first_name_en' => $enNameParts[0],
                'second_name_en' => $enNameParts[1],
                'third_name_en' => $enNameParts[2],
                'last_name_en' => $enNameParts[3],
                'national_id' => $validated['national_id'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'address' => $validated['address'] ?? null,
                'preferred_language' => $validated['preferred_language'] ?? 'ar',
                'password' => Hash::make(
                    $validated['password'] ?? $validated['phone']
                ),
                'is_active' => $validated['is_active'],
                'image' => $imagePath,
                'user_code' => 'SUP-' . strtoupper(uniqid()),
            ]);

            // Attach role
            $role = \App\Models\Role::firstOrCreate(['name' => 'supervisor']);
            $newSupervisor->roles()->attach($role->id);

            // إنشاء بروفايل المشرف
            SupervisorProfile::create([
                'user_id' => $newSupervisor->id,
                'status' => $validated['status'] ?? 'Active',
                'supervisor_type' => $validated['supervisor_type'],
                'tracking_type' => $validated['tracking_type'],
            ]);

            // ربط الباص إذا تم اختياره
            if (!empty($validated['bus_id'])) {
                $bus = Bus::where('id', $validated['bus_id'])->where('school_id', $user->school_id)->first();
                if ($bus) {
                    $bus->update(['supervisor_id' => $newSupervisor->id]);
                }
            }

            DB::commit();
            return redirect()
                ->back()
                ->with('success', 'Supervisor created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'An error occurred while creating the supervisor: ' . $e->getMessage()]);
        }
    }


    /**
     * تحديث بيانات مشرف
     */
    public function update(Request $request, User $supervisor)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 🔐 حماية: لا تعدّل مشرف من مدرسة ثانية
        if (
            $supervisor->school_id !== $user->school_id ||
            !$supervisor->hasRole('supervisor')
        ) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'national_id' => [
                'required',
                'string',
                'max:20',
                Rule::unique('users', 'national_id')->ignore($supervisor->id),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($supervisor->id),
            ],
            'phone' => ['required', 'string', 'max:50', Rule::unique('users', 'phone')->ignore($supervisor->id)],
            'address' => 'nullable|string|max:500',
            'preferred_language' => 'nullable|in:ar,en',
            'password' => 'nullable|string|min:6',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            
            // حقول المشرف
            'supervisor_type' => 'required|in:bus,class,both',
            'tracking_type' => 'required|in:phone,vehicle',
            'is_active' => 'required|boolean',
            'bus_id' => 'nullable|exists:buses,id',
        ]);

        DB::beginTransaction();
        try {
            // رفع الصورة الجديدة إن وجدت
            $imagePath = $supervisor->image;
            if ($request->hasFile('image')) {
                if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
                $imagePath = $request->file('image')->store('users', 'public');
            }

            // Split names
            $nameParts = User::parseFullName($validated['name']);
            $enNameParts = User::parseFullName($validated['name_en'] ?? '');

            // تحديث المستخدم
            $supervisor->update([
                'first_name_ar'  => $nameParts[0],
                'second_name_ar' => $nameParts[1],
                'third_name_ar'  => $nameParts[2],
                'last_name_ar'   => $nameParts[3],
                'first_name_en'  => $enNameParts[0],
                'second_name_en' => $enNameParts[1],
                'third_name_en'  => $enNameParts[2],
                'last_name_en'   => $enNameParts[3],
                'national_id' => $validated['national_id'],
                'email'       => $validated['email'] ?? null,
                'phone'       => $validated['phone'],
                'address'     => $validated['address'] ?? null,
                'preferred_language' => $validated['preferred_language'] ?? 'ar',
                'is_active'   => (bool)$validated['is_active'],
                'image'       => $imagePath,
            ]);

            // تحديث كلمة المرور إذا أُدخلت
            if (!empty($validated['password'])) {
                $supervisor->update(['password' => Hash::make($validated['password'])]);
            }

            // تحديث بروفايل المشرف (أو إنشاءه إن لم يوجد)
            $profile = SupervisorProfile::firstOrCreate(
                ['user_id' => $supervisor->id],
                ['status' => 'Active']
            );
            
            $profile->update([
                'supervisor_type' => $validated['supervisor_type'],
                'tracking_type' => $validated['tracking_type'],
            ]);

            // تحديث الباص
            Bus::where('supervisor_id', $supervisor->id)->update(['supervisor_id' => null]);
            
            if (!empty($validated['bus_id'])) {
                $bus = Bus::where('id', $validated['bus_id'])->where('school_id', $user->school_id)->first();
                if ($bus) {
                    $bus->update(['supervisor_id' => $supervisor->id]);
                }
            }

            DB::commit();
            
            return redirect()
                ->route('school.supervisors.index')
                ->with('success', 'Supervisor updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'An error occurred while updating the supervisor.']);
        }
    }

    /**
     * حذف مشرف
     */
    public function destroy(User $supervisor)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (
            $supervisor->school_id !== $user->school_id ||
            !$supervisor->hasRole('supervisor')
        ) {
            abort(403);
        }

        // حذف الصورة إذا وجدت
        if ($supervisor->image && Storage::disk('public')->exists($supervisor->image)) {
            Storage::disk('public')->delete($supervisor->image);
        }

        $supervisor->delete();

        return redirect()
            ->route('school.supervisors.index')
            ->with('success', 'Supervisor deleted successfully.');
    }
}
