<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\Student;
use App\Models\Bus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RouteController extends Controller
{
    public function index()
    {
        $schoolId = Auth::user()->getSchoolId();
        
        $routes = Route::where('school_id', $schoolId)
            ->withCount(['morningStudents', 'afternoonStudents', 'buses'])
            ->latest()
            ->get();

        return Inertia::render('School/Routes/Index', [
            'routes' => $routes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:routes,code',
            'description' => 'nullable|string|max:1000',
        ]);

        $validated['school_id'] = Auth::user()->getSchoolId();

        Route::create($validated);

        return redirect()->back()->with('success', 'تم إنشاء المسار بنجاح');
    }

    public function update(Request $request, Route $route)
    {
        if ($route->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['nullable', 'string', 'max:50', Rule::unique('routes', 'code')->ignore($route->id)],
            'description' => 'nullable|string|max:1000',
        ]);

        $route->update($validated);

        return redirect()->back()->with('success', 'تم تحديث المسار بنجاح');
    }

    public function destroy(Route $route)
    {
        if ($route->school_id !== Auth::user()->getSchoolId()) {
            abort(403);
        }

        // Check for dependencies
        if ($route->buses()->exists() || $route->morningStudents()->exists() || $route->afternoonStudents()->exists()) {
            return redirect()->back()->with('error', 'لا يمكن حذف المسار لأنه مرتبط بحافلات أو طلاب');
        }

        $route->delete();

        return redirect()->back()->with('success', 'تم حذف المسار بنجاح');
    }
}


