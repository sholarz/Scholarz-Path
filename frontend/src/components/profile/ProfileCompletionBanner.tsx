import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';

interface ProfileCompletionBannerProps {
  profile: {
    fullName: string;
    nationality: string;
    currentCountry: string;
    currentDegree: string;
    targetDegree: string;
    fieldOfStudy: string;
    gpa: string;
    preferredCountries: string[];
    budgetPreference: string;
    preferredStartYear: string;
    languageTests: Array<{ testType: string; overallScore: string }>;
    expectedStartYear: string;
    applicationStatus: string;
  };
}

/**
 * Profile Completion Banner
 * 
 * Displays profile completion percentage and encourages user to complete their profile.
 * Used at the top of the User Profile page.
 */
export function ProfileCompletionBanner({ profile }: ProfileCompletionBannerProps) {
  // Calculate required fields completion
  const requiredFields = [
    profile.fullName,
    profile.nationality,
    profile.currentCountry,
    profile.currentDegree,
    profile.targetDegree,
    profile.fieldOfStudy,
    profile.gpa,
    profile.budgetPreference,
    profile.preferredStartYear,
    profile.expectedStartYear,
    profile.applicationStatus,
  ];

  // Check language tests
  const hasValidLanguageTest = profile.languageTests.some(
    test => test.testType && test.overallScore
  );

  const filledRequired = requiredFields.filter(field => field && field.length > 0).length;
  const totalRequired = requiredFields.length + 1; // +1 for language test
  const completionPercentage = Math.round(
    ((filledRequired + (hasValidLanguageTest ? 1 : 0)) / totalRequired) * 100
  );

  // Optional fields for bonus completion
  const hasOptionalFields = 
    profile.subField ||
    profile.preferredCountries.length > 0 ||
    profile.preferredFields.length > 0;

  const isComplete = completionPercentage === 100;

  if (isComplete && hasOptionalFields) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>Profile Complete!</strong> Your profile is fully filled out. 
          This helps us provide better scholarship recommendations.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-blue-50 border-blue-200 mb-6">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Profile Completion: {completionPercentage}%
              </span>
              <span className="text-xs text-blue-700">
                {filledRequired + (hasValidLanguageTest ? 1 : 0)} of {totalRequired} required fields
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <p className="text-sm text-blue-800">
            {completionPercentage < 100 ? (
              <>
                Complete your profile to get personalized scholarship recommendations. 
                {!hasValidLanguageTest && ' Don\'t forget to add your language test scores!'}
              </>
            ) : (
              'Great! Consider adding preferred countries and fields for better matches.'
            )}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
