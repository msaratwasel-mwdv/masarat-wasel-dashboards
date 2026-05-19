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

class SchoolUsersImport implements ToModel, SkipsEmptyRows, WithStartRow, WithChunkReading, WithBatchInserts, WithUpserts
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
            'last_name_ar' => trim($row[3] ?? ''),
            'first_name_en' => trim($row[4] ?? ''),
            'last_name_en' => trim($row[7] ?? ''),
            'national_id' => trim($row[8] ?? ''),
            'phone' => trim($row[9] ?? ''),
            'email' => trim($row[10] ?? ''),
            'address' => trim($row[11] ?? ''),
            'school_name' => trim($row[12] ?? ''),
        ];

        if (empty($data['national_id']) || empty($data['first_name_ar'])) {
            return null;
        }

        $user = User::updateOrCreate(
            ['national_id' => $data['national_id']],
            [
                'name' => trim($data['first_name_ar'] . ' ' . $data['last_name_ar']),
                'first_name_ar' => $data['first_name_ar'],
                'last_name_ar' => $data['last_name_ar'],
                'first_name_en' => $data['first_name_en'],
                'last_name_en' => $data['last_name_en'],
                'email' => $data['email'] ?: null,
                'phone' => $data['phone'],
                'address' => $data['address'],
                'password' => Hash::make($data['phone']),
            ]
        );

        $role = Role::firstOrCreate(['name' => 'school_admin']);
        $user->roles()->syncWithoutDetaching([$role->id]);

        $school = \App\Models\School::where('name', 'LIKE', '%' . $data['school_name'] . '%')->first();

        if ($school) {
            $user->schoolAdmin()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'school_id' => $school->id,
                    'status' => 'active'
                ]
            );
        }

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
