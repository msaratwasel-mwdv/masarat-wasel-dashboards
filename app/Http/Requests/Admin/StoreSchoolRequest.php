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
            'admin_phone' => ['nullable', 'required_if:create_admin,true', 'string', 'regex:/^[0-9]+$/', 'min:8', 'max:20', 'unique:users,phone'],
            'admin_national_id' => ['nullable', 'string', 'regex:/^[0-9]+$/', 'min:7', 'max:20'],
            'admin_password' => ['nullable', 'required_if:create_admin,true', 'string', 'min:8', 'confirmed'],

            // Subscription & Installments
            'plan_id' => ['nullable', 'exists:plans,id'],
            'installments_count' => ['nullable', 'integer', 'min:1', 'max:12'],
            'price_per_student' => ['nullable', 'numeric', 'min:0'],
            'student_count' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'billing_type' => ['nullable', 'string'],
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
            'installments_count' => 'عدد الأقساط',
            'price_per_student' => 'سعر الطالب',
            'student_count' => 'عدد الطلاب التقديري',
            'start_date' => 'تاريخ بدء الاشتراك',
        ];
    }
}
