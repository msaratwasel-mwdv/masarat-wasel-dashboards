<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\School;
use App\Models\User; // سنحتاج السائقين والمشرفين للقائمة المنسدلة
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

        // 2. جلب السائقين المتاحين (لإظهارهم في المودال)
        // المتاح = سائق شركة (school_id = null)
        $drivers = User::where('role', 'driver')
            ->whereNull('school_id')
            ->select('id', 'name')
            ->get();

        // 3. جلب المشرفين المتاحين
        $supervisors = User::where('role', 'supervisor')
            ->whereNull('school_id')
            ->select('id', 'name')
            ->get();

        return Inertia::render('Admin/Buses/Index', [
            'buses' => $buses,
            'availableDrivers' => $drivers,
            'availableSupervisors' => $supervisors,
            'schools' => School::select('id', 'name')->get(), // ← مهم

        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'plate_number' => 'required|string|unique:buses,plate_number|max:20',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity' => 'required|integer|min:5|max:100',
            // التحقق من صحة المعرفات إذا تم اختيارها
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        DB::transaction(function () use ($request) {
            Bus::create([
                'bus_code' => Bus::generateNextCode(), // الكود السحري هنا
                'plate_number' => $request->plate_number,
                'model' => $request->model,
                'year' => $request->year,
                'capacity' => $request->capacity,
                'status' => 'active',
                'school_id' => null, // يتبع الشركة افتراضياً
                'driver_id' => $request->driver_id,
                'supervisor_id' => $request->supervisor_id,
                // يمكن إضافة كود توليد QR هنا لاحقاً
            ]);
        });

        return redirect()->back()->with('success', 'Bus added successfully');
    }

    public function update(Request $request, Bus $bus)
    {
        $request->validate([
            'plate_number' => ['required', Rule::unique('buses')->ignore($bus->id)],
            'model' => 'required|string',
            'year' => 'required|integer',
            'capacity' => 'required|integer',
            'status' => 'required|in:active,maintenance,inactive,out_of_service',
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        $bus->update($request->all());

        return redirect()->back()->with('success', 'Bus updated successfully');
    }

    public function destroy(Bus $bus)
    {
        $bus->delete();
        return redirect()->back()->with('success', 'Bus deleted successfully');
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
