<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\School;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RouteController extends Controller
{
    public function index()
    {
        $routes = Route::with(['school', 'buses'])
            ->withCount(['morningStudents', 'afternoonStudents'])
            ->latest()
            ->get();

        $schools = School::where('status', 'active')->select('id', 'name')->get();

        return Inertia::render('Admin/Routes/Index', [
            'routes' => $routes,
            'schools' => $schools,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:routes,code',
            'description' => 'nullable|string',
            'school_id' => 'required|exists:schools,id',
        ]);

        Route::create($validated);

        return redirect()->back()->with('success', 'Route created successfully');
    }

    public function update(Request $request, Route $route)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:routes,code,' . $route->id,
            'description' => 'nullable|string',
            'school_id' => 'required|exists:schools,id',
        ]);

        $route->update($validated);

        return redirect()->back()->with('success', 'Route updated successfully');
    }

    public function destroy(Route $route)
    {
        // Optional: check if route has active buses or students before deleting
        if ($route->buses()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete route assigned to buses');
        }

        $route->delete();

        return redirect()->back()->with('success', 'Route deleted successfully');
    }
}
