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
        $buses = Bus::with(['driver', 'supervisor', 'school', 'documents'])
            ->latest()
            ->get();

        // 2. جلب السائقين المتاحين
        // 2. جلب السائقين: HQ + أي سائق مرتبط حالياً بباص
        $drivers = User::where('role', 'driver')
            ->where(function ($q) {
                $q->whereNull('school_id')
                    ->orWhereIn('id', Bus::whereNotNull('driver_id')->pluck('driver_id'));
            })
            ->select('id', 'name')
            ->get();

        // 3. جلب المشرفين: HQ + أي مشرف مرتبط حالياً بباص
        $supervisors = User::where('role', 'supervisor')
            ->where(function ($q) {
                $q->whereNull('school_id')
                    ->orWhereIn('id', Bus::whereNotNull('supervisor_id')->pluck('supervisor_id'));
            })
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
            // 'bus_number' and 'type' are auto-generated or defaulted below since the frontend doesn't send them.
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
            'photos.*' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'registration_file' => 'nullable|mimes:pdf,jpg,png|max:2048',
        ]);

        DB::transaction(function () use ($request) {
            $busCode = Bus::generateNextCode();

            $bus = Bus::create([
                'bus_code' => $busCode,
                'bus_number' => $busCode, // Fallback since frontend removed it
                'plate_number' => $request->plate_number,
                'model' => $request->model,
                'year' => $request->year,
                'capacity' => $request->capacity,
                'type' => 'permanent', // Default type
                'status' => 'active',
                'school_id' => null,
                'driver_id' => $request->driver_id,
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
            // 'bus_number' and 'type' are missing from frontend form, so we remove them from required rules.
            'plate_number' => ['required', 'string', Rule::unique('buses')->ignore($bus->id)],
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity' => 'required|integer|min:5|max:100',
            'status' => 'required|in:active,maintenance,inactive,out_of_service',
            'driver_id' => 'nullable|exists:users,id',
            'supervisor_id' => 'nullable|exists:users,id',
        ]);

        $bus->update($validated);

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
}
