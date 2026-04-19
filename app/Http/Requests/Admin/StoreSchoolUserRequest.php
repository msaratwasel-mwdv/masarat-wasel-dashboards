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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($userId)],
            'national_id' => ['required', 'string', 'max:255', Rule::unique('users', 'national_id')->ignore($userId)],
            'address' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'password' => [$userId ? 'nullable' : 'required', 'confirmed', Rules\Password::defaults()],
        ];
    }
}


