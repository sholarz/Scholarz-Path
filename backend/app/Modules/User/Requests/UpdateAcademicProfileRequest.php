<?php

namespace App\Modules\User\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAcademicProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gpa' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4'],
            'field_of_study' => ['sometimes', 'nullable', 'string', 'max:200'],
            'sub_field' => ['sometimes', 'nullable', 'string', 'max:200'],
            'major' => ['sometimes', 'nullable', 'string', 'max:200'],
            'degree_level' => ['sometimes', 'nullable', 'in:high_school,bachelor,master,doctorate'],
            'target_degree' => ['sometimes', 'nullable', 'in:bachelor,master,doctorate'],
            'graduation_year' => ['sometimes', 'nullable', 'integer', 'min:1950', 'max:2100'],
            'expected_start_year' => ['sometimes', 'nullable', 'integer', 'min:2024', 'max:2035'],
            'application_status' => ['sometimes', 'nullable', 'in:not-started,preparing,ready,applied'],
        ];
    }
}