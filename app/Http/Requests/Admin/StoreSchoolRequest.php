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
            'status' => ['required', 'in:Active,Inactive'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg', 'max:2048'],

            'has_transport' => 'boolean',
            'has_attendance' => 'boolean',

            // Optional Admin Data (Step 2)
            'admin_name' => ['nullable', 'required_if:create_admin,true', 'string', 'max:255'],
            'admin_email' => ['nullable', 'required_if:create_admin,true', 'email', 'max:255', 'unique:users,email'],
            'admin_phone' => ['nullable', 'required_if:create_admin,true', 'string', 'max:20', 'unique:users,phone'],
            'admin_national_id' => ['nullable', 'required_if:create_admin,true', 'string', 'max:255', 'unique:users,national_id'],
            'admin_address' => ['nullable', 'string', 'max:500'],
            'admin_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'admin_password' => ['nullable', 'required_if:create_admin,true', 'string', 'min:8', 'confirmed'],
            'create_admin' => ['boolean'],
        ];
    }
}


