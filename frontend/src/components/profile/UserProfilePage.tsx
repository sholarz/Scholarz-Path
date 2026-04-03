import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { LanguageTestCard, LanguageTest } from './LanguageTestCard';
import { ProfileCompletionBanner } from './ProfileCompletionBanner';
import { Plus, Save, X as XIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

/**
 * USER PROFILE PAGE - DEVELOPER NOTES
 * 
 * Data Structure and Field Types:
 * 
 * interface UserProfile {
 *   // Basic Information
 *   fullName: string;
 *   nationality: string;
 *   currentCountry: string;
 * 
 *   // Academic Background
 *   currentDegree: string ('high-school' | 'bachelor' | 'master' | 'phd');
 *   targetDegree: string ('bachelor' | 'master' | 'phd');
 *   fieldOfStudy: string;
 *   subField?: string;
 *   gpa: number (0.00 - 4.00);
 * 
 *   // Preferences
 *   preferredCountries: string[];
 *   preferredFields: string[];
 *   budgetPreference: string ('full' | 'partial' | 'self-funded');
 *   preferredStartYear: number;
 * 
 *   // Language Tests
 *   languageTests: LanguageTest[];
 * 
 *   // Documents Readiness
 *   documents: {
 *     cvUploaded: boolean;
 *     motivationLetter: boolean;
 *     recommendationLetter: boolean;
 *     transcript: boolean;
 *     passportReady: boolean;
 *   };
 * 
 *   // Application Status
 *   expectedStartYear: number;
 *   applicationStatus: string ('not-started' | 'preparing' | 'ready' | 'applied');
 * }
 */

interface UserProfile {
  fullName: string;
  nationality: string;
  currentCountry: string;
  currentDegree: string;
  targetDegree: string;
  fieldOfStudy: string;
  subField: string;
  gpa: string;
  preferredCountries: string[];
  preferredFields: string[];
  budgetPreference: string;
  preferredStartYear: string;
  languageTests: LanguageTest[];
  documents: {
    cvUploaded: boolean;
    motivationLetter: boolean;
    recommendationLetter: boolean;
    transcript: boolean;
    passportReady: boolean;
  };
  expectedStartYear: string;
  applicationStatus: string;
}

const COUNTRIES = [
  'Indonesia', 'United States', 'United Kingdom', 'Australia', 'Canada',
  'Germany', 'Netherlands', 'Singapore', 'Malaysia', 'Japan', 'South Korea'
];

const FIELDS_OF_STUDY = [
  'Computer Science', 'Engineering', 'Business', 'Medicine', 'Law',
  'Education', 'Arts & Humanities', 'Natural Sciences', 'Social Sciences',
  'Architecture', 'Economics', 'Psychology'
];

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile>({
    fullName: user?.name || '',
    nationality: '',
    currentCountry: '',
    currentDegree: '',
    targetDegree: '',
    fieldOfStudy: '',
    subField: '',
    gpa: '',
    preferredCountries: [],
    preferredFields: [],
    budgetPreference: '',
    preferredStartYear: '',
    languageTests: [
      {
        id: '1',
        testType: '',
        overallScore: '',
        showAdvanced: false,
      }
    ],
    documents: {
      cvUploaded: false,
      motivationLetter: false,
      recommendationLetter: false,
      transcript: false,
      passportReady: false,
    },
    expectedStartYear: '',
    applicationStatus: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Language Tests Management
  const addLanguageTest = () => {
    const newTest: LanguageTest = {
      id: Date.now().toString(),
      testType: '',
      overallScore: '',
      showAdvanced: false,
    };
    setProfile(prev => ({
      ...prev,
      languageTests: [...prev.languageTests, newTest]
    }));
  };

  const updateLanguageTest = (id: string, updates: Partial<LanguageTest>) => {
    setProfile(prev => ({
      ...prev,
      languageTests: prev.languageTests.map(test =>
        test.id === id ? { ...test, ...updates } : test
      )
    }));
  };

  const removeLanguageTest = (id: string) => {
    setProfile(prev => ({
      ...prev,
      languageTests: prev.languageTests.filter(test => test.id !== id)
    }));
  };

  // Multi-select management
  const toggleCountry = (country: string) => {
    setProfile(prev => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(country)
        ? prev.preferredCountries.filter(c => c !== country)
        : [...prev.preferredCountries, country]
    }));
  };

  const removeCountry = (country: string) => {
    setProfile(prev => ({
      ...prev,
      preferredCountries: prev.preferredCountries.filter(c => c !== country)
    }));
  };

  const toggleField = (field: string) => {
    setProfile(prev => ({
      ...prev,
      preferredFields: prev.preferredFields.includes(field)
        ? prev.preferredFields.filter(f => f !== field)
        : [...prev.preferredFields, field]
    }));
  };

  const removeField = (field: string) => {
    setProfile(prev => ({
      ...prev,
      preferredFields: prev.preferredFields.filter(f => f !== field)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, save to backend/Supabase
    console.log('Saving profile:', profile);
    
    toast.success('Profile saved successfully!');
    setIsSaving(false);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  /**
   * DEVELOPER NOTE - Password Update Handler:
   * On click of "Forgot Password", redirect to /forgot-password page.
   * On Update Password, validate that new password matches confirm and meets security requirements.
   * 
   * Password Security Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  const handleUpdatePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }

    setIsUpdatingPassword(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, call Supabase auth.updateUser({ password: newPassword })
    console.log('Updating password...');

    toast.success('Password updated successfully!');
    
    // Reset password fields
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsUpdatingPassword(false);
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4" style={{ maxWidth: '800px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User Profile</h1>
          <p className="text-muted-foreground">
            Complete your profile to get personalized scholarship recommendations
          </p>
        </div>

        {/* Profile Completion Banner */}
        <ProfileCompletionBanner profile={profile} />

        <div className="space-y-6">
          {/* 1. Change Password */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-start">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Password Buttons */}
              <div className="flex justify-end gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={handleCancelPasswordChange}
                  disabled={isUpdatingPassword}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  size="sm"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Basic Information */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal details and current location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Nationality + Current Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Select
                    value={profile.nationality}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, nationality: value }))}
                  >
                    <SelectTrigger id="nationality">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentCountry">Current Country *</Label>
                  <Select
                    value={profile.currentCountry}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, currentCountry: value }))}
                  >
                    <SelectTrigger id="currentCountry">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Academic Background */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Academic Background</CardTitle>
              <CardDescription>
                Your current education level and field of study
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Degree + Target Degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentDegree">Current Degree *</Label>
                  <Select
                    value={profile.currentDegree}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, currentDegree: value }))}
                  >
                    <SelectTrigger id="currentDegree">
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDegree">Target Degree *</Label>
                  <Select
                    value={profile.targetDegree}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, targetDegree: value }))}
                  >
                    <SelectTrigger id="targetDegree">
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Field of Study */}
              <div className="space-y-2">
                <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                <Select
                  value={profile.fieldOfStudy}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, fieldOfStudy: value }))}
                >
                  <SelectTrigger id="fieldOfStudy">
                    <SelectValue placeholder="Select field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS_OF_STUDY.map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="subField">Sub Field (Optional)</Label>
                <Input
                  id="subField"
                  value={profile.subField}
                  onChange={(e) => setProfile(prev => ({ ...prev, subField: e.target.value }))}
                  placeholder="e.g., Machine Learning, Corporate Law, etc."
                />
              </div>

              {/* GPA */}
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA *</Label>
                <Input
                  id="gpa"
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  value={profile.gpa}
                  onChange={(e) => setProfile(prev => ({ ...prev, gpa: e.target.value }))}
                  placeholder="0.00 - 4.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Preferences */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Your scholarship and study preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preferred Countries */}
              <div className="space-y-2">
                <Label htmlFor="preferredCountries">Preferred Countries</Label>
                <Select onValueChange={toggleCountry}>
                  <SelectTrigger id="preferredCountries">
                    <SelectValue placeholder="Select countries" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.filter(c => !profile.preferredCountries.includes(c)).map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profile.preferredCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.preferredCountries.map(country => (
                      <Badge key={country} variant="secondary" className="gap-1">
                        {country}
                        <XIcon
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeCountry(country)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferred Fields */}
              <div className="space-y-2">
                <Label htmlFor="preferredFields">Preferred Fields</Label>
                <Select onValueChange={toggleField}>
                  <SelectTrigger id="preferredFields">
                    <SelectValue placeholder="Select fields" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS_OF_STUDY.filter(f => !profile.preferredFields.includes(f)).map(field => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profile.preferredFields.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.preferredFields.map(field => (
                      <Badge key={field} variant="secondary" className="gap-1">
                        {field}
                        <XIcon
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeField(field)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Preference + Preferred Start Year */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetPreference">Budget Preference *</Label>
                  <Select
                    value={profile.budgetPreference}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, budgetPreference: value }))}
                  >
                    <SelectTrigger id="budgetPreference">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Scholarship</SelectItem>
                      <SelectItem value="partial">Partial Scholarship</SelectItem>
                      <SelectItem value="self-funded">Self-funded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredStartYear">Preferred Start Year *</Label>
                  <Select
                    value={profile.preferredStartYear}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, preferredStartYear: value }))}
                  >
                    <SelectTrigger id="preferredStartYear">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Language Tests */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Language Tests</CardTitle>
              <CardDescription>
                Add your English proficiency test scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.languageTests.map((test) => (
                <LanguageTestCard
                  key={test.id}
                  test={test}
                  onUpdate={updateLanguageTest}
                  onRemove={removeLanguageTest}
                  canRemove={profile.languageTests.length > 1}
                />
              ))}

              <Button
                variant="outline"
                onClick={addLanguageTest}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Language Test
              </Button>
            </CardContent>
          </Card>

          {/* 6. Documents Readiness */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Documents Readiness</CardTitle>
              <CardDescription>
                Check off documents you have ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cvUploaded"
                    checked={profile.documents.cvUploaded}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, cvUploaded: checked as boolean }
                      }))
                    }
                  />
                  <label
                    htmlFor="cvUploaded"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    CV Uploaded
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="motivationLetter"
                    checked={profile.documents.motivationLetter}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, motivationLetter: checked as boolean }
                      }))
                    }
                  />
                  <label
                    htmlFor="motivationLetter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Motivation Letter
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recommendationLetter"
                    checked={profile.documents.recommendationLetter}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, recommendationLetter: checked as boolean }
                      }))
                    }
                  />
                  <label
                    htmlFor="recommendationLetter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Recommendation Letter
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transcript"
                    checked={profile.documents.transcript}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, transcript: checked as boolean }
                      }))
                    }
                  />
                  <label
                    htmlFor="transcript"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Transcript
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passportReady"
                    checked={profile.documents.passportReady}
                    onCheckedChange={(checked) =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, passportReady: checked as boolean }
                      }))
                    }
                  />
                  <label
                    htmlFor="passportReady"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Passport Ready
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7. Application Status */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>
                Your current application timeline and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedStartYear">Expected Start Year *</Label>
                  <Select
                    value={profile.expectedStartYear}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, expectedStartYear: value }))}
                  >
                    <SelectTrigger id="expectedStartYear">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationStatus">Application Status *</Label>
                  <Select
                    value={profile.applicationStatus}
                    onValueChange={(value) => setProfile(prev => ({ ...prev, applicationStatus: value }))}
                  >
                    <SelectTrigger id="applicationStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready to Apply</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none sm:px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-none sm:px-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}