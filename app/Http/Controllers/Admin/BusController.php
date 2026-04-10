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
    use \App\Traits\DataTableTrait;

    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        // 1. Base query for buses
        $query = Bus::with(['drivers.user', 'fieldSupervisor', 'school', 'route']);

        // Filter by archive or status
        if ($statusFilter === 'archived') {
            $query->onlyTrashed();
        } else {
            if ($statusFilter === 'out_of_service') {
                $query->whereIn('status', ['out_of_service', 'inactive']);
            } elseif ($statusFilter !== 'all') {
                $query->where('status', $statusFilter);
            }
        }

        // Apply DataTable (search, sort, paginate)
        $paginated = $this->applyDataTable($query, $request, [
            'bus_number',
            'plate_number',
            'model',
            'school.name',
            'drivers.user.name',
            'fieldSupervisor.name',
            'route.name',
        ], 15, function($bus) {
            return [
                'رقم الباص' => $bus->bus_number,
                'رقم اللوحة' => $bus->plate_number,
                'الموديل' => $bus->model,
                'سنة الصنع' => $bus->manufacturing_year,
                'السعة' => $bus->capacity,
                'المدرسة' => $bus->school ? $bus->school->name : 'غير محدد',
                'المسار' => $bus->route ? $bus->route->name : 'غير محدد',
                'السائق' => $bus->drivers->count() > 0 && $bus->drivers->first()->user ? $bus->drivers->first()->user->name : 'متاح',
                'المشرفة' => $bus->fieldSupervisor ? $bus->fieldSupervisor->name : 'متاح',
                'الحالة' => match($bus->status) {
                    'active' => 'نشط',
                    'maintenance' => 'صيانة',
                    'out_of_service' => 'خارج الخدمة',
                    'inactive' => 'غير نشط',
                    default => 'مؤرشف'
                },
            ];
        });

        if ($paginated instanceof \Symfony\Component\HttpFoundation\Response) {
            return $paginated;
        }

        // Get counts (unfiltered)
        $counts = [
            'all' => Bus::count(),
            'active' => Bus::where('status', 'active')->count(),
            'maintenance' => Bus::where('status', 'maintenance')->count(),
            'out_of_service' => Bus::whereIn('status', ['out_of_service', 'inactive'])->count(),
            'archived' => Bus::onlyTrashed()->count(),
        ];

        // 3. جلب السائقين المتاحين
        $assignedDriverIds = \App\Models\Driver::whereNotNull('bus_id')->pluck('user_id')->toArray();
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereNotIn('id', $assignedDriverIds)
            ->select('id', 'first_name_ar', 'last_name_ar', 'national_id')
            ->get();

        // 4. جلب المشرفين المتاحين
        $assignedSupervisorIds = Bus::whereNotNull('field_supervisor_id')->pluck('field_supervisor_id')->toArray();
        $supervisors = User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))
            ->whereNotIn('id', $assignedSupervisorIds)
            ->select('id', 'first_name_ar', 'last_name_ar', 'national_id')
            ->get();

        // 5. جلب المدارس النشطة
        $schools = School::where('status', 'Active')->get();

        // 6. جلب جميع المسارات
        $routes = \App\Models\Route::select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Buses/Index', [
            'buses'                => $paginated,
            'counts'               => $counts,
            'filters'              => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ],
            'availableDrivers'     => $drivers,
            'availableSupervisors' => $supervisors,
            'schools'              => $schools,
            'routes'               => $routes,
        ]);
    }

    public function create()
    {
        $schools = School::where('status', 'Active')->get();
        // NOTE: school_id does NOT exist on users table — filter via extension tables
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereDoesntHave('driver', fn($q) => $q->whereNotNull('school_id'))
            ->get();
        $supervisors = User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))
            ->whereDoesntHave('fieldSupervisor', fn($q) => $q->whereNotNull('school_id'))
            ->get();

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
                    if ($value && \App\Models\Driver::where('user_id', $value)->whereNotNull('bus_id')->exists()) {
                        $fail('هذا السائق مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
            'supervisor_id'     => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين مشرف مرتبط بباص آخر
                function ($attribute, $value, $fail) {
                    if ($value && Bus::where('field_supervisor_id', $value)->exists()) {
                        $fail('هذا المشرف مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
            'photos.*'          => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'registration_file' => 'nullable|mimes:pdf,jpg,png|max:2048',
        ]);

        DB::transaction(function () use ($request) {
            $busNumber = Bus::generateNextCode();

            $bus = Bus::create([
                'bus_number'    => $busNumber,
                'plate_number'  => $request->plate_number,
                'model'         => $request->model,
                'year'          => $request->year,
                'capacity'      => $request->capacity,
                'status'        => 'active',
                'school_id'             => null,
                'field_supervisor_id'   => $request->supervisor_id,
            ]);

            // Map driver model directly
            if ($request->driver_id) {
                \App\Models\Driver::where('user_id', $request->driver_id)
                    ->update(['bus_id' => $bus->id, 'school_id' => null]);
            }

            $qrData = "ID: $bus->id\nNumber: $busNumber\nPlate: $request->plate_number\nEmergency: 999";
            $qrFileName = 'qrcodes/' . $busNumber . '.svg';
            Storage::disk('public')->makeDirectory('qrcodes');
            Storage::disk('public')->put($qrFileName, QrCode::format('svg')->size(300)->generate($qrData));
            $bus->update(['front_qr' => $qrFileName]);

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
        $assignedDriverIds = \App\Models\Driver::whereNotNull('bus_id')
            ->where('bus_id', '!=', $bus->id)
            ->pluck('user_id')
            ->toArray();
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereNotIn('id', $assignedDriverIds)
            ->get();

        // المشرفون المتاحون: غير مُعيَّنين لأي باص + المشرف الحالي لهذا الباص
        $assignedSupervisorIds = Bus::whereNotNull('field_supervisor_id')
            ->where('id', '!=', $bus->id)
            ->pluck('field_supervisor_id')
            ->toArray();
        $supervisors = User::whereHas('roles', fn($q) => $q->where('name', 'supervisor'))
            ->whereNotIn('id', $assignedSupervisorIds)
            ->get();

        return Inertia::render('Admin/Buses/Edit', [
            'bus' => $bus->load(['school', 'drivers.user', 'fieldSupervisor']),
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
                    if ($value && \App\Models\Driver::where('user_id', $value)->whereNotNull('bus_id')->where('bus_id', '!=', $busId)->exists()) {
                        $fail('هذا السائق مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
            'supervisor_id' => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين مشرف مرتبط بباص آخر (غير هذا الباص)
                function ($attribute, $value, $fail) use ($busId) {
                    if ($value && Bus::where('field_supervisor_id', $value)->where('id', '!=', $busId)->exists()) {
                        $fail('هذا المشرف مُعيَّن لباص آخر بالفعل.');
                    }
                },
            ],
        ]);

        DB::transaction(function () use ($bus, $validated) {
            $oldDriverId     = $bus->drivers->first()->user_id ?? null;
            $oldSupervisorId = $bus->field_supervisor_id;
            $newDriverId     = $validated['driver_id'] ?? null;
            $newSupervisorId = $validated['supervisor_id'] ?? null;
            $schoolId        = $bus->school_id; // احتفظ بمدرسة الباص الحالية
            
            // Map request supervisor_id to field_supervisor_id
            if (array_key_exists('supervisor_id', $validated)) {
                $validated['field_supervisor_id'] = $validated['supervisor_id'];
                unset($validated['supervisor_id']);
            }
            if (array_key_exists('driver_id', $validated)) {
                unset($validated['driver_id']);
            }

            $bus->update($validated);

            // NOTE: school_id does NOT exist on the users table.
            // Driver/supervisor school association lives in drivers.school_id / field_supervisors.school_id.
            // Update those extension records when driver/supervisor assignment changes.
            if ($oldDriverId !== $newDriverId) {
                if ($oldDriverId) {
                    \App\Models\Driver::where('user_id', $oldDriverId)->update(['bus_id' => null, 'school_id' => null]);
                }
                if ($newDriverId) {
                    \App\Models\Driver::where('user_id', $newDriverId)->update(['bus_id' => $bus->id, 'school_id' => $bus->school_id]);
                }
            }

            if ($oldSupervisorId !== $newSupervisorId) {
                if ($oldSupervisorId) {
                    \App\Models\FieldSupervisor::where('user_id', $oldSupervisorId)->update(['school_id' => null]);
                }
                if ($newSupervisorId) {
                    \App\Models\FieldSupervisor::where('user_id', $newSupervisorId)->update(['school_id' => $bus->school_id]);
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
            // 1. Update bus school
            $bus->update(['school_id' => $schoolId]);

            // 2. Update driver extension record (school_id lives in drivers table)
            if ($bus->drivers()->exists()) {
                $bus->drivers()->update(['school_id' => $schoolId]);
            }

            // 3. Update supervisor extension record (school_id lives in field_supervisors table)
            if ($bus->field_supervisor_id) {
                \App\Models\FieldSupervisor::where('user_id', $bus->field_supervisor_id)->update(['school_id' => $schoolId]);
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

    /**
     * استعادة حافلة مؤرشفة.
     */
    public function restore($busId)
    {
        $bus = Bus::onlyTrashed()->findOrFail($busId);
        $bus->restore();
        $bus->update(['status' => 'active']);

        return redirect()->back()->with('success', 'تم استعادة الحافلة بنجاح');
    }
}


