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
            'major' => ['sometimes', 'nullable', 'string', 'max:200'],
            'degree_level' => ['sometimes', 'nullable', 'in:high_school,bachelor,master,doctorate'],
            'graduation_year' => ['sometimes', 'nullable', 'integer', 'min:1950', 'max:2100'],
        ];
    }
}