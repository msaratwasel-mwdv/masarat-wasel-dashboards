<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:' . User::class],
            'phone' => ['required', 'string', 'max:20', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ];
    }
}
