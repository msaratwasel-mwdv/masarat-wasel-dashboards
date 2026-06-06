<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class StoreSchoolUserRequest extends FormRequest
{
    // هل يسمح للمستخدم بعمل هذا الطلب؟ نعم، لأننا حمينا الراوت بالـ Middleware
    public function authorize(): bool
    {
        return true;
    }

    // هنا تضع القوانين التي كانت في الكنترولر
    public function rules(): array
    {
        $userId = $this->route('user') ? $this->route('user')->id : null;
        
        return [
            'first_name_ar' => ['required', 'string', 'max:255'],
            'last_name_ar'  => ['required', 'string', 'max:255'],
            'first_name_en' => ['nullable', 'string', 'max:255'],
            'last_name_en'  => ['nullable', 'string', 'max:255'],
            'name'          => ['nullable', 'string', 'max:255'],
            'name_en'       => ['nullable', 'string', 'max:255'],
            'email'       => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone'       => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($userId)],
            'national_id' => ['required', 'string', 'max:255', Rule::unique('users', 'national_id')->ignore($userId)],
            'address'     => ['nullable', 'string', 'max:500'],
            'image'       => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'school_id'   => ['nullable', 'exists:schools,id'],
            // كلمة المرور إلزامية عند الإنشاء، اختيارية عند التعديل، 6 أحرف كحد أدنى
            'password'    => [$userId ? 'nullable' : 'required', 'confirmed', 'min:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'الاسم مطلوب.',
            'email.required'       => 'البريد الإلكتروني مطلوب.',
            'email.email'          => 'صيغة البريد الإلكتروني غير صحيحة.',
            'email.unique'         => 'هذا البريد الإلكتروني مستخدم بالفعل.',
            'phone.required'       => 'رقم الهاتف مطلوب.',
            'phone.unique'         => 'رقم الهاتف مستخدم بالفعل.',
            'national_id.required' => 'الرقم المدني مطلوب.',
            'national_id.unique'   => 'هذا الرقم المدني مسجل بالفعل.',
            'password.required'    => 'كلمة المرور مطلوبة.',
            'password.confirmed'   => 'كلمة المرور وتأكيدها غير متطابقتين.',
            'password.min'         => 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
        ];
    }
}


