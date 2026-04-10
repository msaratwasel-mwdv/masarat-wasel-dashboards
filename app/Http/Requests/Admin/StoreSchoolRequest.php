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
            // الطريقة الصحيحة (مصفوفة من القواعد المنفصلة)
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:Active,Inactive'],

            // أو يمكنك استخدام طريقة النص بدون أقواس المصفوفة
            'has_transport' => 'boolean',
            'has_attendance' => 'boolean',
        ];
    }
}


