<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use App\Models\Classroom;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class StudentsImport implements ToModel, SkipsEmptyRows, WithStartRow, WithChunkReading, WithBatchInserts, WithValidation, SkipsOnFailure, SkipsOnError
{
    use SkipsFailures, SkipsErrors;
    public $successCount = 0;
    protected $schoolId;
    protected $defaultClassroomId;

    public function __construct() {
        $this->schoolId = Auth::user()->getSchoolId();
        // Fallback classroom for imported students
        $classroom = Classroom::atSchool($this->schoolId)->first();
        $this->defaultClassroomId = $classroom ? $classroom->id : null;
    }

    public function startRow(): int { return 3; }
    public function batchSize(): int { return 100; }
    public function chunkSize(): int { return 100; }

    public function isEmptyWhen(array $row): bool
    {
        foreach ($row as $v) { 
            if (is_string($v) && trim($v) !== '') return false; 
            elseif (!is_string($v) && $v !== null) return false; 
        }
        return true;
    }

    public function rules(): array
    {
        return [
            // Student
            '0' => 'required|string|max:255', // first_name_ar
            '1' => 'required|string|max:255', // last_name_ar
            '2' => 'nullable|string|max:255', // first_name_en
            '3' => 'nullable|string|max:255', // last_name_en
            '4' => 'required|string|max:50',  // national_id student
            '5' => 'required|string|in:male,female,ذكر,انثى,أنثى', // gender
            
            // Guardian
            '6' => 'required|string|max:50', // national_id guardian
            '7' => 'nullable|string|max:255', // guardian name
            '8' => 'nullable|string|max:50', // guardian phone
            '9' => 'nullable|string|max:255', // relationship
        ];
    }

    public function prepareForValidation($row, $index)
    {
        foreach ($row as $k => $v) { 
            if (is_scalar($v)){
                $t = trim((string)$v);
                $row[$k] = $t === '' ? null : $t;
            } 
        }
        
        if (isset($row[5]) && $row[5] !== null) {
            $g = strtolower($row[5]);
            if ($g == 'ذكر' || $g == 'male' || $g == 'm') $row[5] = 'male';
            elseif ($g == 'أنثى' || $g == 'انثى' || $g == 'female' || $g == 'f') $row[5] = 'female';
        }

        return $row;
    }

    public function model(array $row)
    {
        // Require a default classroom to link to the school
        if (!$this->defaultClassroomId) {
            return null; // Cannot import if school has no classrooms
        }

        $s_first_ar = $row[0] ?? '';
        $s_last_ar = $row[1] ?? '';
        $s_first_en = $row[2] ?? '';
        $s_last_en = $row[3] ?? '';
        $s_national_id = $row[4] ?? '';
        $s_gender = $row[5] ?? 'male';
        
        $g_national_id = $row[6] ?? '';
        $g_name = $row[7] ?? '';
        $g_phone = $row[8] ?? '';
        $g_relationship = $row[9] ?? 'أب';

        if (empty($s_national_id) || empty($g_national_id)) return null;

        DB::transaction(function() use ($s_first_ar, $s_last_ar, $s_first_en, $s_last_en, $s_national_id, $s_gender, $g_national_id, $g_name, $g_phone, $g_relationship) {
            
            // 1. Resolve Guardian
            $guardianUser = User::whereHas('roles', fn($q) => $q->whereIn('name', ['parent', 'guardian']))
                ->where('national_id', $g_national_id)
                ->first();

            if (!$guardianUser) {
                // Guardian doesn't exist, create them
                if (empty($g_name)) $g_name = 'ولي أمر ' . $s_first_ar;
                if (empty($g_phone)) $g_phone = $g_national_id; // Fallback
                
                $nameParts = User::parseFullName($g_name);
                
                $guardianUser = User::create([
                    'first_name_ar' => $nameParts[0],
                    'last_name_ar' => $nameParts[3] ?: $nameParts[0],
                    'first_name_en' => $nameParts[0], // fallback
                    'last_name_en' => $nameParts[3] ?: $nameParts[0],
                    'national_id' => $g_national_id,
                    'phone' => $g_phone,
                    'password' => Hash::make($g_phone),
                ]);

                $role = Role::firstOrCreate(['name' => 'parent']);
                $guardianUser->roles()->syncWithoutDetaching([$role->id]);
                \App\Models\Guardian::create(['user_id' => $guardianUser->id]);
            }

            // 2. Create or Update Student
            $student = Student::firstWhere('national_id', $s_national_id);
            if (!$student) {
                $student = Student::create([
                    'first_name_ar' => $s_first_ar,
                    'last_name_ar' => $s_last_ar,
                    'first_name_en' => $s_first_en,
                    'last_name_en' => $s_last_en,
                    'national_id' => $s_national_id,
                    'student_code' => 'ST-' . $s_national_id,
                    'gender' => $s_gender,
                ]);

                // Enroll student
                $student->enrollments()->create([
                    'classroom_id' => $this->defaultClassroomId,
                    'is_active' => true,
                ]);
            } else {
                // Update basic info
                $student->update([
                    'first_name_ar' => $s_first_ar,
                    'last_name_ar' => $s_last_ar,
                    'first_name_en' => $s_first_en,
                    'last_name_en' => $s_last_en,
                    'gender' => $s_gender,
                ]);
            }

            // 3. Link Student to Guardian
            $student->guardians()->syncWithoutDetaching([
                $guardianUser->id => ['relationship_type' => $g_relationship]
            ]);

            $this->successCount++;
        });

        return null;
    }
}
