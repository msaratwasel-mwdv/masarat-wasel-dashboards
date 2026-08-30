<?php

// app/Imports/DriversImport.php

namespace App\Imports;

use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\WithValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class DriversImport implements SkipsEmptyRows, SkipsOnError, SkipsOnFailure, ToModel, WithBatchInserts, WithChunkReading, WithStartRow, WithUpserts, WithValidation
{
    use SkipsErrors, SkipsFailures;

    public $successCount = 0;

    public function startRow(): int
    {
        return 3; // Skip the instruction row and heading row
    }

    public function isEmptyWhen(array $row): bool
    {
        foreach ($row as $value) {
            if (is_string($value) && trim($value) !== '') {
                return false;
            } elseif (! is_string($value) && $value !== null) {
                return false;
            }
        }

        return true;
    }

    public function rules(): array
    {
        return [
            '0' => 'required_without:2|nullable|string|max:255',
            '1' => 'required_with:0|nullable|string|max:255',
            '2' => 'required_without:0|nullable|string|max:255',
            '3' => 'required_with:2|nullable|string|max:255',
            '4' => 'required|string|regex:/^[0-9]+$/|min:7|max:20', // National ID / Civil ID is required
            '5' => 'required|string|regex:/^[0-9]+$/|min:8|max:20', // Phone is required
            '6' => 'nullable|email|max:255', // Email is optional
            '7' => 'nullable|string|max:255',
            '8' => 'nullable|string|max:255',
            '9' => 'nullable|date_format:Y-m-d', // Must be clean date
            '10' => 'nullable|string|in:ar,en', // Preferred language must be 'ar' or 'en'
        ];
    }

    public function prepareForValidation($row, $index)
    {
        // Sanitize, trim strings and convert empty strings to null
        foreach ($row as $key => $value) {
            if (is_scalar($value)) {
                $trimmed = trim((string) $value);
                $row[$key] = $trimmed === '' ? null : $trimmed;
            }
        }

        // Transform Excel date index 9 to standard Y-m-d before validation runs
        if (isset($row[9]) && $row[9] !== null) {
            $row[9] = $this->transformDate($row[9]);
        }

        // Prepare preferred language
        if (isset($row[10]) && $row[10] !== null) {
            $row[10] = strtolower($row[10]);
        }

        return $row;
    }

    public function messages(): array
    {
        return [
            '0.required_without' => 'الاسم الأول (بالعربي) مطلوب إذا لم يتم إدخال الاسم الإنجليزي / Arabic First Name is required if English Name is empty',
            '1.required_with' => 'اسم العائلة (بالعربي) مطلوب / Arabic Last Name is required',
            '2.required_without' => 'الاسم الأول (بالإنجليزي) مطلوب إذا لم يتم إدخال الاسم العربي / English First Name is required if Arabic Name is empty',
            '3.required_with' => 'اسم العائلة (بالإنجليزي) مطلوب / English Last Name is required',
            '4.required' => 'الرقم المدني مطلوب / Civil ID is required',
            '5.required' => 'رقم الجوال مطلوب / Phone is required',
            '6.email' => 'صيغة البريد الإلكتروني غير صحيحة / Invalid email format',
            '6.unique' => 'البريد الإلكتروني مستخدم مسبقاً / This email is already taken',
            '9.date_format' => 'صيغة التاريخ غير صحيحة (يجب أن تكون Y-m-d) / Invalid date format (must be Y-m-d)',
            '10.in' => 'اللغة المفضلة يجب أن تكون ar أو en / Preferred language must be ar or en',
        ];
    }

    public function customValidationAttributes(): array
    {
        return [
            '0' => 'الاسم الأول (بالعربي) / First Name (AR)',
            '1' => 'اسم العائلة (بالعربي) / Last Name (AR)',
            '2' => 'الاسم الأول (بالإنجليزي) / First Name (EN)',
            '3' => 'اسم العائلة (بالإنجليزي) / Last Name (EN)',
            '4' => 'الرقم المدني / Civil ID',
            '5' => 'الجوال / Phone',
            '6' => 'البريد الإلكتروني / Email',
            '7' => 'العنوان / Address',
            '8' => 'رقم الرخصة / License Number',
            '9' => 'تاريخ انتهاء الرخصة / License Expiry Date',
            '10' => 'اللغة المفضلة / Preferred Language',
        ];
    }

    public function model(array $row)
    {
        $data = [
            'first_name_ar' => trim($row[0] ?? ''),
            'last_name_ar' => trim($row[1] ?? ''),
            'first_name_en' => trim($row[2] ?? ''),
            'last_name_en' => trim($row[3] ?? ''),
            'national_id' => trim($row[4] ?? ''),
            'phone' => trim($row[5] ?? ''),
            'email' => trim($row[6] ?? ''),
            'address' => trim($row[7] ?? ''),
            'license_number' => trim($row[8] ?? ''),
            'license_expiry_date' => $row[9] ?? null, // Preprocessed date
            'preferred_language' => strtolower(trim($row[10] ?? 'ar')) ?: 'ar',
        ];

        // Double check safety
        if (empty($data['national_id']) || (empty($data['first_name_ar']) && empty($data['first_name_en']))) {
            return null;
        }

        $user = User::updateOrCreate(
            ['national_id' => $data['national_id']],
            [
                'name' => trim(($data['first_name_ar'] ?: $data['first_name_en']).' '.($data['last_name_ar'] ?: $data['last_name_en'])),
                'first_name_ar' => $data['first_name_ar'] ?: '',
                'last_name_ar' => $data['last_name_ar'] ?: '',
                'first_name_en' => $data['first_name_en'] ?: '',
                'last_name_en' => $data['last_name_en'] ?: '',
                'email' => $data['email'] ?: null,
                'phone' => $data['phone'],
                'address' => $data['address'] ?: null,
                'password' => Hash::make($data['phone']),
                'preferred_language' => $data['preferred_language'],
            ]
        );

        $role = Role::firstOrCreate(['name' => 'driver']);
        $user->roles()->syncWithoutDetaching([$role->id]);

        $user->driver()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'license_number' => $data['license_number'] ?: null,
                'license_expiry_date' => $data['license_expiry_date'] ?: null,
            ]
        );

        $this->successCount++;

        return null; // Return null since we save manually to update relations correctly
    }

    public function batchSize(): int
    {
        return 100;
    }

    public function chunkSize(): int
    {
        return 100;
    }

    public function uniqueBy()
    {
        return 'national_id';
    }

    /**
     * Parse date from Excel format or native string to Y-m-d format
     */
    private function transformDate($value)
    {
        if (! $value) {
            return null;
        }

        try {
            // Numeric internal Excel date format
            if (is_numeric($value)) {
                return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
            }

            // String parse via Carbon
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return $value; // Return raw to let validation raise clear error message
        }
    }
}
