<?php

namespace App\Imports;

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class GuardiansImport implements ToModel, SkipsEmptyRows, WithStartRow, WithChunkReading, WithBatchInserts, WithUpserts, WithValidation, SkipsOnFailure, SkipsOnError
{
    use SkipsFailures, SkipsErrors;
    public $successCount = 0;

    public function startRow(): int { return 3; }
    public function batchSize(): int { return 100; }
    public function chunkSize(): int { return 100; }
    public function uniqueBy() { return 'national_id'; }

    public function isEmptyWhen(array $row): bool
    {
        foreach ($row as $v) { if (is_string($v)&&trim($v)!=='') return false; elseif (!is_string($v)&&$v!==null) return false; }
        return true;
    }

    public function rules(): array
    {
        return [
            '0'=>'required_without:2|nullable|string|max:255','1'=>'required_with:0|nullable|string|max:255',
            '2'=>'required_without:0|nullable|string|max:255','3'=>'required_with:2|nullable|string|max:255',
            '4'=>'required|string|max:20','5'=>'required|string|max:20',
            '6'=>'nullable|email|max:255','7'=>'nullable|string|max:500',
            '8'=>'nullable|string|in:ar,en',
        ];
    }

    public function prepareForValidation($row, $index)
    {
        foreach ($row as $k=>$v) { if (is_scalar($v)){$t=trim((string)$v);$row[$k]=$t===''?null:$t;} }
        if (isset($row[8])&&$row[8]!==null) $row[8]=strtolower($row[8]);
        return $row;
    }

    public function messages(): array
    {
        return [
            '0.required_without'=>'الاسم الأول (بالعربي) مطلوب / Arabic First Name required if English empty',
            '1.required_with'=>'اسم العائلة (بالعربي) مطلوب / Arabic Last Name required',
            '2.required_without'=>'الاسم الأول (بالإنجليزي) مطلوب / English First Name required if Arabic empty',
            '3.required_with'=>'اسم العائلة (بالإنجليزي) مطلوب / English Last Name required',
            '4.required'=>'الرقم المدني مطلوب / Civil ID required','5.required'=>'رقم الجوال مطلوب / Phone required',
            '6.email'=>'صيغة البريد غير صحيحة / Invalid email',
            '8.in'=>'اللغة يجب أن تكون ar أو en / Language must be ar or en',
        ];
    }

    public function customValidationAttributes(): array
    {
        return [
            '0'=>'الاسم الأول (عربي) / First Name (AR)','1'=>'اسم العائلة (عربي) / Last Name (AR)',
            '2'=>'الاسم الأول (إنجليزي) / First Name (EN)','3'=>'اسم العائلة (إنجليزي) / Last Name (EN)',
            '4'=>'الرقم المدني / Civil ID','5'=>'الجوال / Phone','6'=>'البريد / Email',
            '7'=>'العنوان / Address','8'=>'اللغة المفضلة / Preferred Language',
        ];
    }

    public function model(array $row)
    {
        $d = [
            'first_name_ar'=>trim($row[0]??''),'last_name_ar'=>trim($row[1]??''),
            'first_name_en'=>trim($row[2]??''),'last_name_en'=>trim($row[3]??''),
            'national_id'=>trim($row[4]??''),'phone'=>trim($row[5]??''),
            'email'=>trim($row[6]??''),'address'=>trim($row[7]??''),
            'preferred_language'=>strtolower(trim($row[8]??'ar'))?:'ar',
        ];
        if (empty($d['national_id'])||(empty($d['first_name_ar'])&&empty($d['first_name_en']))) return null;

        $user = User::updateOrCreate(['national_id'=>$d['national_id']],[
            'first_name_ar'=>$d['first_name_ar']?:'','last_name_ar'=>$d['last_name_ar']?:'',
            'first_name_en'=>$d['first_name_en']?:'','last_name_en'=>$d['last_name_en']?:'',
            'email'=>$d['email']?:null,'phone'=>$d['phone'],'address'=>$d['address']?:null,
            'password'=>Hash::make($d['phone']),'preferred_language'=>$d['preferred_language'],
        ]);

        $role = Role::firstOrCreate(['name'=>'parent']);
        $user->roles()->syncWithoutDetaching([$role->id]);
        $user->guardian()->updateOrCreate(['user_id'=>$user->id],['status'=>'active']);

        $this->successCount++;
        return null;
    }
}
