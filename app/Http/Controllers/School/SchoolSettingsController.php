<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;

class SchoolSettingsController extends Controller
{
    /**
     * Update the school's information.
     */
    public function update(Request $request)
    {
        $schoolId = auth()->user()->getSchoolId();
        
        if (!$schoolId) {
            return Redirect::back()->with('error', 'School context not found.');
        }

        $school = School::findOrFail($schoolId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'logo' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($school->logo) {
                $oldPath = str_replace('/storage/', '', $school->logo);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
            $path = $request->file('logo')->store('schools/logos', 'public');
            $validated['logo'] = $path;
        }

        $school->update($validated);

        return Redirect::route('profile.edit')->with('success', app()->getLocale() === 'ar' ? 'تم تحديث إعدادات المدرسة بنجاح.' : 'School settings updated successfully.');
    }
}
