<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Illuminate\Support\Facades\Hash;
use App\Models\Role;

class DriversImport implements ToModel, SkipsEmptyRows, WithStartRow, WithChunkReading, WithBatchInserts, WithUpserts
{
    public $errors = [];
    public $successCount = 0;

    public function startRow(): int
    {
        return 3; // Skip the instruction row and heading row
    }

    public function model(array $row)
    {
        $data = [
            'first_name_ar' => trim($row[0] ?? ''),
            'second_name_ar' => trim($row[1] ?? ''),
            'third_name_ar' => trim($row[2] ?? ''),
            'last_name_ar' => trim($row[3] ?? ''),
            'first_name_en' => trim($row[4] ?? ''),
            'second_name_en' => trim($row[5] ?? ''),
            'third_name_en' => trim($row[6] ?? ''),
            'last_name_en' => trim($row[7] ?? ''),
            'national_id' => trim($row[8] ?? ''),
            'phone' => trim($row[9] ?? ''),
            'email' => trim($row[10] ?? ''),
            'address' => trim($row[11] ?? ''),
            'license_number' => trim($row[12] ?? ''),
            'license_expiry_date' => $this->transformDate($row[13] ?? null),
        ];

        // التحقق الأساسي السريع
        if (empty($data['national_id']) || empty($data['first_name_ar'])) {
            return null;
        }

        $user = User::updateOrCreate(
            ['national_id' => $data['national_id']],
            [
                'name' => trim($data['first_name_ar'] . ' ' . $data['last_name_ar']),
                'first_name_ar' => $data['first_name_ar'],
                'second_name_ar' => $data['second_name_ar'],
                'third_name_ar' => $data['third_name_ar'],
                'last_name_ar' => $data['last_name_ar'],
                'first_name_en' => $data['first_name_en'],
                'second_name_en' => $data['second_name_en'],
                'third_name_en' => $data['third_name_en'],
                'last_name_en' => $data['last_name_en'],
                'email' => $data['email'] ?: null,
                'phone' => $data['phone'],
                'address' => $data['address'],
                'password' => Hash::make($data['phone']),
            ]
        );

        $role = Role::firstOrCreate(['name' => 'driver']);
        $user->roles()->syncWithoutDetaching([$role->id]);

        $user->driver()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'license_number' => $data['license_number'],
                'license_expiry_date' => $data['license_expiry_date'],
            ]
        );

        $this->successCount++;
        return null; // نرجع null لأننا قمنا بالحفظ يدوياً لضمان العلاقات (Relations)
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
     * تحويل التاريخ من تنسيق إكسيل (رقمي أو نصي) إلى تنسيق Y-m-d
     */
    private function transformDate($value)
    {
        if (!$value) return null;

        try {
            // إذا كان التاريخ رقمياً (تنسيق إكسيل الداخلي)
            if (is_numeric($value)) {
                return ExcelDate::excelToDateTimeObject($value)->format('Y-m-d');
            }

            // إذا كان نصاً، نحاول تحويله عبر Carbon
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return $value; // إرجاعه كما هو ليدعه يفشل في الـ Validator مع رسالة خطأ واضحة
        }
    }
}
