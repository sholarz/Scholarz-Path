<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required'],
            'name' => ['required_without:first_name,last_name', 'string', 'max:200'],
            'first_name' => ['required_without:name', 'string', 'max:100'],
            'last_name' => ['required_without:name', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email sudah terdaftar.',
            'email.email' => 'Format email tidak valid.',
            'password.min' => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak sesuai.',
            'name.required_without' => 'Nama lengkap wajib diisi.',
            'first_name.required_without' => 'Nama depan wajib diisi.',
            'last_name.required_without' => 'Nama belakang wajib diisi.',
        ];
    }
}
