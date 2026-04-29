<?php

namespace App\Imports;

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithUpserts;

class AssistantsImport implements ToModel, SkipsEmptyRows, WithStartRow, WithChunkReading, WithBatchInserts, WithUpserts
{
    public $errors = [];
    public $successCount = 0;

    public function startRow(): int
    {
        return 3;
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
            'emergency_contact_name' => trim($row[12] ?? ''),
            'emergency_contact_phone' => trim($row[13] ?? ''),
        ];

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

        $role = Role::firstOrCreate(['name' => 'assistant']);
        $user->roles()->syncWithoutDetaching([$role->id]);

        $user->assistant()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'emergency_contact_name' => $data['emergency_contact_name'],
                'emergency_contact_phone' => $data['emergency_contact_phone'],
                'status' => 'active',
            ]
        );

        $this->successCount++;
        return null;
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
}
