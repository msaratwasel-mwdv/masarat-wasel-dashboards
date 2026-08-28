<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'status' => ['required', 'in:Active,Inactive'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
            'plan_id' => ['nullable', 'exists:plans,id'],

            // Optional School Admin
            'create_admin' => ['nullable', 'boolean'],
            'admin_name' => ['nullable', 'required_if:create_admin,true', 'string', 'max:255'],
            'admin_email' => ['nullable', 'required_if:create_admin,true', 'email', 'max:255', 'unique:users,email'],
            'admin_phone' => ['nullable', 'required_if:create_admin,true', 'string', 'max:20', 'unique:users,phone'],
            'admin_national_id' => ['nullable', 'string', 'max:255'],
            'admin_password' => ['nullable', 'required_if:create_admin,true', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'اسم المدرسة',
            'address' => 'عنوان المدرسة',
            'status' => 'حالة المدرسة',
            'logo' => 'شعار المدرسة',
            'plan_id' => 'خطة الاشتراك',
            'admin_name' => 'اسم المدير الكامل',
            'admin_email' => 'البريد الإلكتروني للمدير',
            'admin_phone' => 'رقم هاتف المدير',
            'admin_password' => 'كلمة المرور',
        ];
    }
}
