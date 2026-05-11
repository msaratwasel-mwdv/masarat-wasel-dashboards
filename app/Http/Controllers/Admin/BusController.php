<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusDocument;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Http;

class BusController extends Controller
{
    use \App\Traits\DataTableTrait;

    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        // 1. Base query for buses
        $query = Bus::withStudentsCount()->with([
            'driver.user:id,first_name_ar,second_name_ar,third_name_ar,last_name_ar,image',
            'assistant:id,first_name_ar,second_name_ar,third_name_ar,last_name_ar,image',
            'school:id,name',
            'route:id,name,code',
            'documents',
        ]);

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
            'driver.user.name',
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
                'السائق' => $bus->driver?->user?->name ?? 'متاح',
                'مشرفة الحافلة' => $bus->assistant ? $bus->assistant->name : 'متاح',
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
        $assignedDriverIds = Bus::whereNotNull('driver_id')->pluck('driver_id')->toArray();
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereNotIn('id', $assignedDriverIds)
            ->select('id', 'first_name_ar', 'second_name_ar', 'third_name_ar', 'last_name_ar', 'national_id')
            ->get();


        // 5. جلب مساعدات الباص المتاحات (المشرفات سابقاً)
        $assignedAssistantIds = Bus::whereNotNull('assistant_id')->pluck('assistant_id')->toArray();
        $assistants = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))
            ->whereNotIn('id', $assignedAssistantIds)
            ->select('id', 'first_name_ar', 'second_name_ar', 'third_name_ar', 'last_name_ar', 'national_id')
            ->get();

        // 6. جلب المدارس النشطة
        $schools = School::where('status', 'Active')->get();

        // 7. جلب جميع المسارات
        $routes = \App\Models\Route::select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        // Transform the collection to match frontend expectations (driver -> User model)
        $paginated->getCollection()->transform(function ($bus) {
            if ($bus->driver) {
                // Replace the driver relationship with the driver's user model
                $bus->setRelation('driver', $bus->driver->user);
            }
            return $bus;
        });

        return Inertia::render('Admin/Buses/Index', [
            'buses'                => $paginated,
            'counts'               => $counts,
            'filters'              => [
                'search' => $request->input('search', ''),
                'status' => $statusFilter,
            ],
            'availableDrivers'     => $drivers,
            'availableAssistants'  => $assistants,
            'schools'              => $schools,
            'routes'               => $routes,
        ]);
    }

/*     public function create()
    {
        $schools = School::where('status', 'Active')->get();
        // NOTE: school_id does NOT exist on users table — filter via extension tables
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereDoesntHave('driver', fn($q) => $q->whereNotNull('school_id'))
            ->get();
        $assistants = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))
            ->get();

        return Inertia::render('Admin/Buses/Create', [
            'schools' => $schools,
            'drivers' => $drivers,
            'assistants' => $assistants,
        ]);
    } */

    public function store(Request $request)
    {
        $request->validate([
            'school_id'         => 'nullable|exists:schools,id',
            'route_id'          => 'nullable|exists:routes,id',
            'plate_number'      => 'required|string|unique:buses,plate_number',
            'model'             => 'required|string|max:100',
            'year'              => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity'          => 'required|integer|min:5|max:100',
            'color'             => 'nullable|string|max:50',
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

            'assistant_id' => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين مساعدة مرتبطة بباص آخر
                function ($attribute, $value, $fail) {
                    if ($value && Bus::where('assistant_id', $value)->exists()) {
                        $fail('هذه المساعدة مُعيَّنة لباص آخر بالفعل.');
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
                'school_id'           => $request->school_id,
                'route_id'            => $request->route_id,
                'driver_id'           => $request->driver_id,

                'assistant_id'        => $request->assistant_id,
                'color'               => $request->color,
            ]);

            $this->generateQRCodes($bus);

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

        // Capture values before transaction for use in post-commit logging
        $busId     = $bus->id;
        $busNumber = $bus->bus_number;
        $archivedBy = auth()->id();

        $result = DB::transaction(function () use ($bus, $request) {
            // 1. فصل الطلاب المرتبطين بهذا الباص (atomic)
            $detachedForth = Student::where('forth_bus_id', $bus->id)->update(['forth_bus_id' => null]);
            $detachedBack  = Student::where('back_bus_id',  $bus->id)->update(['back_bus_id'  => null]);

            // 2. تحديث حالة الباص وأرشفته
            $bus->update([
                'status'               => 'out_of_service',
                'deactivation_reason'  => $request->deactivation_reason,
            ]);
            $bus->delete(); // Soft Delete

            return ['forth' => $detachedForth, 'back' => $detachedBack];
        });

        // Log AFTER successful transaction — side effects must not be inside transactions
        Log::info('[BusArchive] Bus archived with student cleanup', [
            'bus_id'         => $busId,
            'bus_number'     => $busNumber,
            'detached_forth' => $result['forth'],
            'detached_back'  => $result['back'],
            'archived_by'    => $archivedBy,
        ]);

        return redirect()->back()->with('success', 'Bus archived successfully');
    }

/*     public function edit(Bus $bus)
    {
        $schools = School::where('status', 'active')->get();

        // السائقون المتاحون: غير مُعيَّنين لأي باص + السائق الحالي لهذا الباص
        $assignedDriverIds = Bus::whereNotNull('driver_id')
            ->where('id', '!=', $bus->id)
            ->pluck('driver_id')
            ->toArray();
        $drivers = User::whereHas('roles', fn($q) => $q->where('name', 'driver'))
            ->whereNotIn('id', $assignedDriverIds)
            ->get();

        // المشرفون الميدانيون المتاحون: غير مُعيَّنين لأي باص + المشرف الحالي لهذا الباص
        $assignedFieldSupervisorIds = Bus::whereNotNull('field_supervisor_id')
            ->where('id', '!=', $bus->id)
            ->pluck('field_supervisor_id')
            ->toArray();
        $fieldSupervisors = User::whereHas('roles', fn($q) => $q->where('name', 'field_supervisor'))
            ->whereNotIn('id', $assignedFieldSupervisorIds)
            ->get();

        // مساعدات الباص المتاحات: غير مُعيَّنات لأي باص + المساعدة الحالية لهذا الباص
        $assignedAssistantIds = Bus::whereNotNull('assistant_id')
            ->where('id', '!=', $bus->id)
            ->pluck('assistant_id')
            ->toArray();
        $assistants = User::whereHas('roles', fn($q) => $q->where('name', 'assistant'))
            ->whereNotIn('id', $assignedAssistantIds)
            ->get();

        return Inertia::render('Admin/Buses/Edit', [
            'bus' => $bus->load(['school', 'driver.user', 'fieldSupervisor', 'assistant']),
            'schools' => $schools,
            'drivers' => $drivers,
            'fieldSupervisors' => $fieldSupervisors,
            'assistants' => $assistants,
        ]);
    } */

    public function update(Request $request, Bus $bus)
    {
        $busId = $bus->id;

        $validated = $request->validate([
            'school_id'    => 'nullable|exists:schools,id',
            'route_id'     => 'nullable|exists:routes,id',
            'plate_number' => ['required', 'string', Rule::unique('buses')->ignore($bus->id)],
            'model'        => 'required|string|max:100',
            'year'         => 'required|integer|min:2000|max:' . (date('Y') + 1),
            'capacity'     => 'required|integer|min:5|max:100',
            'color'        => 'nullable|string|max:50',
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

            'assistant_id' => [
                'nullable',
                'exists:users,id',
                // يمنع تعيين مساعدة مرتبطة بباص آخر (غير هذا الباص)
                function ($attribute, $value, $fail) use ($busId) {
                    if ($value && Bus::where('assistant_id', $value)->where('id', '!=', $busId)->exists()) {
                        $fail('هذه المساعدة مُعيَّنة لباص آخر بالفعل.');
                    }
                },
            ],
        ]);

        DB::transaction(function () use ($bus, $validated) {
            // Remove non-schema fields from validation array before update
            $updateData = collect($validated)->except(['photos', 'registration_file'])->toArray();

            $bus->update($updateData);

            // Upload new files if provided
            $this->uploadFiles(request(), $bus);

            // Regnerate QRs if missing
            if (!$bus->front_qr || !$bus->back_qr) {
                $this->generateQRCodes($bus);
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
        // Capture before transaction — values may not be accessible post soft-delete
        $busId     = $bus->id;
        $deletedBy = auth()->id();

        DB::transaction(function () use ($bus) {
            // فصل الطلاب المرتبطين أولاً (atomic)
            Student::where('forth_bus_id', $bus->id)->update(['forth_bus_id' => null]);
            Student::where('back_bus_id',  $bus->id)->update(['back_bus_id'  => null]);

            $bus->delete(); // Soft Delete
        });

        // Log AFTER successful transaction — side effects outside transaction
        Log::info('[BusDelete] Bus soft-deleted with student cleanup', [
            'bus_id'     => $busId,
            'deleted_by' => $deletedBy,
        ]);

        return redirect()->route('admin.buses.index')
            ->with('success', 'تم حذف الحافلة بنجاح');
    }

    public function assignToSchool(Request $request, Bus $bus)
    {
        $request->validate([
            'school_id' => 'nullable|exists:schools,id',
        ]);

        $schoolId = $request->school_id ?: null;

        if ($schoolId) {
            $school = School::findOrFail($schoolId);
            $maxBuses = $school->maxBuses();
            
            // If maxBuses is null, it's unlimited. If it's an int, check count.
            if ($maxBuses !== null) {
                $currentBusesCount = Bus::where('school_id', $schoolId)->where('id', '!=', $bus->id)->count();
                if ($currentBusesCount >= $maxBuses) {
                    return redirect()->back()->with('error', "عذراً، هذه المدرسة استنفذت الحد الأقصى للحافلات المسموح به في باقتها ({$maxBuses} حافلة).");
                }
            }
        }

        DB::transaction(function () use ($schoolId, $bus) {
            // 1. Update bus school
            $bus->update(['school_id' => $schoolId]);
        });

        $message = $schoolId ? 'تم إسناد الحافلة للمدرسة بنجاح' : 'تم سحب الحافلة للمقر الرئيسي بنجاح';
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

    /**
     * Generate QR codes (Front and Back) for the bus.
     */
    private function generateQRCodes(Bus $bus)
    {
        $busNumber = $bus->bus_number;
        $frontData = "FRONT-" . $bus->id;
        $backData = "BACK-" . $bus->id;

        $frontFileName = 'qrcodes/' . $busNumber . '_front.png';
        $backFileName = 'qrcodes/' . $busNumber . '_back.png';

        Storage::disk('public')->makeDirectory('qrcodes');

        try {
            // Using external API for PNG generation
            $qrApiUrlFront = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" . urlencode($frontData) . "&margin=10&format=png";
            $qrApiUrlBack = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" . urlencode($backData) . "&margin=10&format=png";

            $respFront = Http::timeout(10)->get($qrApiUrlFront);
            $respBack = Http::timeout(10)->get($qrApiUrlBack);

            if ($respFront->successful() && $respBack->successful()) {
                Storage::disk('public')->put($frontFileName, $respFront->body());
                Storage::disk('public')->put($backFileName, $respBack->body());

                $bus->update([
                    'front_qr' => $frontFileName,
                    'back_qr' => $backFileName
                ]);
                return;
            }
        } catch (\Exception $e) {
            // Fallback will happen below
        }

        // Fallback to local SVG generation
        $frontFileNameSvg = 'qrcodes/' . $busNumber . '_front.svg';
        $backFileNameSvg = 'qrcodes/' . $busNumber . '_back.svg';

        $qrImageFront = QrCode::format('svg')->size(400)->margin(2)->generate($frontData);
        $qrImageBack = QrCode::format('svg')->size(400)->margin(2)->generate($backData);

        Storage::disk('public')->put($frontFileNameSvg, $qrImageFront);
        Storage::disk('public')->put($backFileNameSvg, $qrImageBack);

        $bus->update([
            'front_qr' => $frontFileNameSvg,
            'back_qr' => $backFileNameSvg
        ]);
    }
}


