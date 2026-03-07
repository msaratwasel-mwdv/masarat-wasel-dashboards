<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusDocument;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class BusController extends Controller
{
    public function index()
    {
        // 1. جلب الباصات مع علاقاتها
        $buses = Bus::with(['driver', 'supervisor', 'school', 'documents', 'route'])
            ->latest()
            ->get();

        // 2. جلب السائقين المتاحين: فقط من ليس مُعيَّناً لأي باص حالياً
        $assignedDriverIds = Bus::whereNotNull('driver_id')->pluck('driver_id')->toArray();
        $drivers = User::where('role', 'driver')
            ->whereNotIn('id', $assignedDriverIds)
            ->select('id', 'name')
            ->get();

        // 3. جلب المشرفين المتاحين: فقط من ليس مُعيَّناً لأي باص حالياً
        $assignedSupervisorIds = Bus::whereNotNull('supervisor_id')->pluck('supervisor_id')->toArray();
        $supervisors = User::where('role', 'supervisor')
            ->whereNotIn('id', $assignedSupervisorIds)
            ->select('id', 'name')
            ->get();

        // 4. جلب المدارس النشطة
        $schools = School::where('status', 'active')->get();

        // 5. جلب جميع المسارات
        $routes = \App\Models\Route::select('id', 'name', 'code', 'school_id')
            ->with('school:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Buses/Index', [
            'buses'                => $buses,
            'availableDrivers'     => $drivers,
            'availableSupervisors' => $supervisors,
            'schools'              => $schools,
            'routes'               => $routes,
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
        $request->validate([
            'school_id'         => 'nullable|exists:schools,id',
            'driver_id'         => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين سائق مرتبط بباص آخر
                function ($attribute, $value, $fail) {
                    if ($value && Bus::where('driver_id', $value)->exists()) {
                        $fail('هذا السائق مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
            'supervisor_id'     => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين مشرف مرتبط بباص آخر
                function ($attribute, $value, $fail) {
                    if ($value && Bus::where('supervisor_id', $value)->exists()) {
                        $fail('هذا المشرف مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
            'photos.*'          => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'registration_file' => 'nullable|mimes:pdf,jpg,png|max:2048',
        ]);

        DB::transaction(function () use ($request) {
            $busCode = Bus::generateNextCode();

            $bus = Bus::create([
                'bus_code'      => $busCode,
                'bus_number'    => $busCode,
                'plate_number'  => $request->plate_number,
                'model'         => $request->model,
                'year'          => $request->year,
                'capacity'      => $request->capacity,
                'type'          => 'permanent',
                'status'        => 'active',
                'school_id'     => null,
                'driver_id'     => $request->driver_id,
                'supervisor_id' => $request->supervisor_id,
            ]);

            $qrData = "ID: $bus->id\nCode: $busCode\nPlate: $request->plate_number\nEmergency: 999";
            $qrFileName = 'qrcodes/' . $busCode . '.svg';
            Storage::disk('public')->makeDirectory('qrcodes');
            Storage::disk('public')->put($qrFileName, QrCode::format('svg')->size(300)->generate($qrData));
            $bus->update(['qr_code_path' => $qrFileName]);

            $this->uploadFiles($request, $bus);
        });

        return redirect()->back()->with('success', 'Bus added successfully');
    }

    protected function uploadFiles(Request $request, Bus $bus)
    {
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('bus_photos', 'public');
                BusDocument::create([
                    'bus_id' => $bus->id,
                    'type' => 'photo',
                    'file_path' => $path,
                ]);
            }
        }

        if ($request->hasFile('registration_file')) {
            $path = $request->file('registration_file')->store('bus_docs', 'public');
            BusDocument::create([
                'bus_id' => $bus->id,
                'type' => 'registration',
                'file_path' => $path,
            ]);
        }
    }

    public function archive(Request $request, Bus $bus)
    {
        $request->validate([
            'deactivation_reason' => 'required|string|max:255',
        ]);

        $bus->update([
            'status' => 'out_of_service',
            'deactivation_reason' => $request->deactivation_reason
        ]);

        $bus->delete();

        return redirect()->back()->with('success', 'Bus archived successfully');
    }

    public function edit(Bus $bus)
    {
        $schools = School::where('status', 'active')->get();

        // السائقون المتاحون: غير مُعيَّنين لأي باص + السائق الحالي لهذا الباص
        $assignedDriverIds = Bus::whereNotNull('driver_id')
            ->where('id', '!=', $bus->id)
            ->pluck('driver_id')
            ->toArray();
        $drivers = User::where('role', 'driver')
            ->whereNotIn('id', $assignedDriverIds)
            ->get();

        // المشرفون المتاحون: غير مُعيَّنين لأي باص + المشرف الحالي لهذا الباص
        $assignedSupervisorIds = Bus::whereNotNull('supervisor_id')
            ->where('id', '!=', $bus->id)
            ->pluck('supervisor_id')
            ->toArray();
        $supervisors = User::where('role', 'supervisor')
            ->whereNotIn('id', $assignedSupervisorIds)
            ->get();

        return Inertia::render('Admin/Buses/Edit', [
            'bus' => $bus->load(['school', 'driver', 'supervisor']),
            'schools' => $schools,
            'drivers' => $drivers,
            'supervisors' => $supervisors,
        ]);
    }

    public function update(Request $request, Bus $bus)
    {
        $busId = $bus->id;

        $validated = $request->validate([
            'school_id'    => 'nullable|exists:schools,id',
            'plate_number' => ['required', 'string', Rule::unique('buses')->ignore($bus->id)],
            'model'        => 'required|string|max:100',
            'year'         => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity'     => 'required|integer|min:5|max:100',
            'status'       => 'required|in:active,maintenance,inactive,out_of_service',
            'driver_id'    => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين سائق مرتبط بباص آخر (غير هذا الباص)
                function ($attribute, $value, $fail) use ($busId) {
                    if ($value && Bus::where('driver_id', $value)->where('id', '!=', $busId)->exists()) {
                        $fail('هذا السائق مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
            'supervisor_id' => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين مشرف مرتبط بباص آخر (غير هذا الباص)
                function ($attribute, $value, $fail) use ($busId) {
                    if ($value && Bus::where('supervisor_id', $value)->where('id', '!=', $busId)->exists()) {
                        $fail('هذا المشرف مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
        ]);

        DB::transaction(function () use ($bus, $validated) {
            $oldDriverId     = $bus->driver_id;
            $oldSupervisorId = $bus->supervisor_id;
            $newDriverId     = $validated['driver_id'] ?? null;
            $newSupervisorId = $validated['supervisor_id'] ?? null;
            $schoolId        = $bus->school_id; // احتفظ بمدرسة الباص الحالية

            $bus->update($validated);

            // إذا تغيّر السائق: حرِّر القديم وأسند الجديد لنفس مدرسة الباص
            if ($oldDriverId !== $newDriverId) {
                if ($oldDriverId) {
                    User::where('id', $oldDriverId)->update(['school_id' => null]);
                }
                if ($newDriverId) {
                    User::where('id', $newDriverId)->update(['school_id' => $schoolId]);
                }
            }

            // إذا تغيّر المشرف: حرِّر القديم وأسند الجديد لنفس مدرسة الباص
            if ($oldSupervisorId !== $newSupervisorId) {
                if ($oldSupervisorId) {
                    User::where('id', $oldSupervisorId)->update(['school_id' => null]);
                }
                if ($newSupervisorId) {
                    User::where('id', $newSupervisorId)->update(['school_id' => $schoolId]);
                }
            }
        });

        return redirect()->route('admin.buses.index')
            ->with('success', 'تم تحديث بيانات الحافلة بنجاح');
    }

    public function deleteDocument(BusDocument $document)
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return redirect()->back()->with('success', 'Document deleted');
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
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $schoolId = $request->school_id ?: null;

        DB::transaction(function () use ($schoolId, $bus) {
            // 1. تحديث الباص لتبعية المدرسة (أو تفريغه)
            $bus->update(['school_id' => $schoolId]);

            // 2. تحديث السائق المرتبط (إن وجد)
            if ($bus->driver_id) {
                User::where('id', $bus->driver_id)->update(['school_id' => $schoolId]);
            }

            // 3. تحديث المشرف المرتبط (إن وجد)
            if ($bus->supervisor_id) {
                User::where('id', $bus->supervisor_id)->update(['school_id' => $schoolId]);
            }
        });

        $message = $schoolId ? 'تم إسناد الباص للمدرسة بنجاح' : 'تم سحب الباص للمقر الرئيسي بنجاح';
        return redirect()->back()->with('success', $message);
    }

    public function assignRoute(Request $request, Bus $bus)
    {
        $request->validate([
            'route_id' => 'nullable|exists:routes,id',
        ]);

        $bus->update(['route_id' => $request->route_id ?: null]);

        $message = $request->route_id
            ? 'تم تعيين المسار للحافلة بنجاح'
            : 'تم إلغاء تعيين المسار عن الحافلة';

        return redirect()->back()->with('success', $message);
    }
}
