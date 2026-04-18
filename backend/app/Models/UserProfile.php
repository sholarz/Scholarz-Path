<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Arr;

class UserProfile extends Model
{
    use HasFactory, HasUuids;

    public const BASIC_FIELDS = [
        'first_name',
        'last_name',
        'phone',
        'date_of_birth',
        'nationality',
        'current_country',
    ];

    public const ACADEMIC_FIELDS = [
        'gpa',
        'field_of_study',
        'sub_field',
        'major',
        'degree_level',
        'target_degree',
        'graduation_year',
        'expected_start_year',
        'application_status',
    ];

    public const PROFILE_FIELDS = [
        ...self::BASIC_FIELDS,
        ...self::ACADEMIC_FIELDS,
    ];

    public const STATUS_DRAFT = 'draft';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'phone',
        'date_of_birth',
        'nationality',
        'current_country',
        'gpa',
        'field_of_study',
        'sub_field',
        'major',
        'degree_level',
        'target_degree',
        'graduation_year',
        'expected_start_year',
        'application_status',
        'profile_completion_percentage',
        'profile_status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'gpa' => 'decimal:2',
        'profile_completion_percentage' => 'integer',
        'profile_status' => 'string',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function refreshProfileProgress(): self
    {
        $profileData = Arr::only($this->getAttributes(), self::PROFILE_FIELDS);

        $this->profile_completion_percentage = $this->calculateCompletionPercentage($profileData);
        $this->profile_status = $this->determineProfileStatus($profileData);

        return $this;
    }

    public function calculateCompletionPercentage(array $profileData): int
    {
        if (count(self::PROFILE_FIELDS) === 0) {
            return 0;
        }

        $completedFields = 0;

        foreach (self::PROFILE_FIELDS as $field) {
            if (filled($profileData[$field] ?? null)) {
                $completedFields++;
            }
        }

        return (int) round(($completedFields / count(self::PROFILE_FIELDS)) * 100);
    }

    public function basicCompletionPercentage(): int
    {
        return $this->calculateSectionCompletion(self::BASIC_FIELDS);
    }

    public function academicCompletionPercentage(): int
    {
        return $this->calculateSectionCompletion(self::ACADEMIC_FIELDS);
    }

    public function missingBasicFields(): array
    {
        return $this->missingFields(self::BASIC_FIELDS);
    }

    public function missingAcademicFields(): array
    {
        return $this->missingFields(self::ACADEMIC_FIELDS);
    }

    public function basicSection(): array
    {
        return Arr::only($this->toArray(), array_merge(['id'], self::BASIC_FIELDS));
    }

    public function academicSection(): array
    {
        return Arr::only($this->toArray(), array_merge(['id'], self::ACADEMIC_FIELDS));
    }

    public function statusSection(): array
    {
        return [
            'profile_status' => $this->profile_status ?? self::STATUS_DRAFT,
            'profile_completion_percentage' => $this->profile_completion_percentage ?? 0,
            'basic_completion_percentage' => $this->basicCompletionPercentage(),
            'academic_completion_percentage' => $this->academicCompletionPercentage(),
            'is_basic_complete' => $this->basicCompletionPercentage() === 100,
            'is_academic_complete' => $this->academicCompletionPercentage() === 100,
            'missing_fields' => [
                'basic' => $this->missingBasicFields(),
                'academic' => $this->missingAcademicFields(),
            ],
        ];
    }

    private function calculateSectionCompletion(array $fields): int
    {
        if (count($fields) === 0) {
            return 0;
        }

        $completedFields = 0;

        foreach ($fields as $field) {
            if (filled($this->getAttribute($field))) {
                $completedFields++;
            }
        }

        return (int) round(($completedFields / count($fields)) * 100);
    }

    private function determineProfileStatus(array $profileData): string
    {
        $completionPercentage = $this->calculateCompletionPercentage($profileData);

        if ($completionPercentage >= 100) {
            return self::STATUS_COMPLETED;
        }

        if ($completionPercentage > 0) {
            return self::STATUS_IN_PROGRESS;
        }

        return self::STATUS_DRAFT;
    }

    private function missingFields(array $fields): array
    {
        $missingFields = [];

        foreach ($fields as $field) {
            if (!filled($this->getAttribute($field))) {
                $missingFields[] = $field;
            }
        }

        return $missingFields;
    }
}
