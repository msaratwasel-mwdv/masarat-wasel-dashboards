<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SearchController extends Controller
{
    /**
     * البحث المتقدم عن الطلاب، الأولياء، والمشرفين
     */
    public function search(Request $request)
    {
        $schoolId = Auth::user()->getSchoolId();
        $query = $request->q;

        if (!$query || strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // 1. البحث في الطلاب
        $students = Student::inSchool($schoolId)
            ->where(function ($q) use ($query) {
                $q->where('first_name_ar', 'like', "%{$query}%")
                  ->orWhere('last_name_ar', 'like', "%{$query}%")
                    ->orWhere('national_id', 'like', "%{$query}%")
                    ->orWhere('student_code', 'like', "%{$query}%");
            })
            ->with(['guardians:id,first_name_ar,second_name_ar,third_name_ar,last_name_ar,phone,national_id', 'currentEnrollment.classroom:id,name'])
            ->limit(5)
            ->get(['id', 'first_name_ar', 'last_name_ar', 'national_id', 'student_code']);

        foreach ($students as $student) {
            $results[] = [
                'type' => 'student',
                'data' => [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'national_id' => $student->national_id,
                    'student_code' => $student->student_code,
                    'guardian' => $student->guardians->first(),
                    'classroom' => $student->currentEnrollment?->classroom
                ]
            ];
        }

        // 2. البحث في الأولياء (الآن من جدول users بشرط role = parent)
        $guardians = User::atSchool($schoolId)
            ->whereHas('roles', fn($q) => $q->where('roles.name', 'parent'))
            ->where(function ($q) use ($query) {
                $q->where('first_name_ar', 'like', "%{$query}%")
                    ->orWhere('last_name_ar', 'like', "%{$query}%")
                    ->orWhere('national_id', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'first_name_ar', 'last_name_ar', 'national_id', 'phone', 'email']);

        foreach ($guardians as $guardian) {
            $results[] = [
                'type' => 'guardian',
                'data' => $guardian
            ];
        }

        // 3. البحث في المساعدين
        $assistants = User::atSchool($schoolId)
            ->whereHas('roles', fn($q) => $q->whereIn('roles.name', ['assistant', 'teacher', 'school_admin']))
            ->where(function ($q) use ($query) {
                $q->where('first_name_ar', 'like', "%{$query}%")
                    ->orWhere('last_name_ar', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'first_name_ar', 'last_name_ar', 'email', 'phone']);

        foreach ($assistants as $assistant) {
            $results[] = [
                'type' => 'assistant',
                'data' => $assistant
            ];
        }

        return response()->json($results);
    }
}




