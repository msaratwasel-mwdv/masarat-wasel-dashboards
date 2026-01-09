<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class BusController extends Controller
{
    public function index()
    {
        // 1. جلب الباصات مع علاقاتها
        $buses = Bus::with(['driver', 'supervisor', 'school'])
            ->latest()
            ->get();

        // 2. جلب السائقين المتاحين
        $drivers = User::where('role', 'driver')
            ->whereNull('school_id')
            ->select('id', 'name')
            ->get();

        // 3. جلب المشرفين المتاحين
        $supervisors = User::where('role', 'supervisor')
            ->whereNull('school_id')
            ->select('id', 'name')
            ->get();

        // 4. جلب المدارس النشطة (من تغيير المدير)
        $schools = School::where('status', 'active')->get();

        return Inertia::render('Admin/Buses/Index', [
            'buses' => $buses,
            'availableDrivers' => $drivers,
            'availableSupervisors' => $supervisors,
            'schools' => $schools,
        ]);
    }

    public function create()
    {
        $schools = School::where('status', 'active')->get();
        $drivers = User::where('role', 'driver')->whereNull('school_id')->get();
        $supervisors = User::where('role', 'supervisor')->whereNull('school_id')->get();

        return Inertia::render('Admin/Buses/Create', [
            'schools' => $schools,
            'drivers' => $drivers,
            'supervisors' => $supervisors,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'bus_number' => 'required|string|unique:buses',
            'plate_number' => 'required|string|unique:buses|max:20',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity' => 'required|integer|min:5|max:100',
            'type' => 'required|in:permanent,temporary',
            'status' => 'required|in:active,maintenance,inactive,out_of_service',
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        DB::transaction(function () use ($validated) {
            Bus::create([
                'bus_code' => Bus::generateNextCode(),
                'bus_number' => $validated['bus_number'],
                'plate_number' => $validated['plate_number'],
                'model' => $validated['model'],
                'year' => $validated['year'],
                'capacity' => $validated['capacity'],
                'type' => $validated['type'],
                'status' => $validated['status'],
                'school_id' => $validated['school_id'],
                'driver_id' => $validated['driver_id'],
                'supervisor_id' => $validated['supervisor_id'],
            ]);
        });

        return redirect()->route('admin.buses.index')
            ->with('success', 'تم إضافة الحافلة بنجاح');
    }

    public function edit(Bus $bus)
    {
        $schools = School::where('status', 'active')->get();
        $drivers = User::where('role', 'driver')->whereNull('school_id')->get();
        $supervisors = User::where('role', 'supervisor')->whereNull('school_id')->get();

        return Inertia::render('Admin/Buses/Edit', [
            'bus' => $bus->load(['school', 'driver', 'supervisor']),
            'schools' => $schools,
            'drivers' => $drivers,
            'supervisors' => $supervisors,
        ]);
    }

    public function update(Request $request, Bus $bus)
    {
        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'bus_number' => ['required', 'string', Rule::unique('buses')->ignore($bus->id)],
            'plate_number' => ['required', 'string', Rule::unique('buses')->ignore($bus->id)],
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity' => 'required|integer|min:5|max:100',
            'type' => 'required|in:permanent,temporary',
            'status' => 'required|in:active,maintenance,inactive,out_of_service',
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        $bus->update($validated);

        return redirect()->route('admin.buses.index')
            ->with('success', 'تم تحديث بيانات الحافلة بنجاح');
    }

    public function destroy(Bus $bus)
    {
        $bus->delete();
        return redirect()->route('admin.buses.index')
            ->with('success', 'تم حذف الحافلة بنجاح');
    }

    public function assignToSchool(Request $request, Bus $bus)
    {
        $request->validate([
            'school_id' => 'required|exists:schools,id',
        ]);

        DB::transaction(function () use ($request, $bus) {
            // 1. تحديث الباص لتبعية المدرسة
            $bus->update(['school_id' => $request->school_id]);

            // 2. تحديث السائق المرتبط (إن وجد)
            if ($bus->driver_id) {
                User::where('id', $bus->driver_id)->update(['school_id' => $request->school_id]);
            }

            // 3. تحديث المشرف المرتبط (إن وجد)
            if ($bus->supervisor_id) {
                User::where('id', $bus->supervisor_id)->update(['school_id' => $request->school_id]);
            }
        });

        return redirect()->back()->with('success', 'تم إسناد الباص والطاقم للمدرسة بنجاح');
    }
}