import { useState, useEffect } from 'react';
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
import { Plus, Save, X as XIcon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';
import { apiGet, apiPut, apiPost, apiDelete } from '../../lib/api-client';

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

// ─── degree value mapping ───────────────────────────────────────────────────
// Frontend uses 'high-school' / 'bachelor' / 'master' / 'phd'
// Backend expects  'high_school' / 'bachelor' / 'master' / 'doctorate'
const toBackendDegree = (v: string) =>
  v === 'high-school' ? 'high_school' : v === 'phd' ? 'doctorate' : v;
const fromBackendDegree = (v: string | null | undefined) =>
  v === 'high_school' ? 'high-school' : v === 'doctorate' ? 'phd' : v ?? '';

const fromBackendTestName = (v: string): LanguageTest['testType'] => {
  if (v === 'ielts') return 'IELTS';
  if (v === 'toefl_ibt') return 'TOEFL';
  if (v === 'duolingo') return 'Duolingo';
  return '';
};

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
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
      { id: '1', testType: '', overallScore: '', showAdvanced: false },
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

  // ── Load existing profile from backend on mount ──────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // 1. Core profile
        type ProfileMe = {
          user: { email: string };
          profile: {
            basic: {
              first_name?: string | null;
              last_name?: string | null;
              nationality?: string | null;
              current_country?: string | null;
            };
            academic: {
              gpa?: string | null;
              field_of_study?: string | null;
              sub_field?: string | null;
              major?: string | null;
              degree_level?: string | null;
              target_degree?: string | null;
              graduation_year?: number | null;
              expected_start_year?: number | null;
              application_status?: string | null;
            };
          };
          languages: Array<{
            id: string;
            language: string;
            proficiency_level: string;
            certification?: string | null;
            score?: string | null;
          }>;
        };
        const me = await apiGet<ProfileMe>('/profile/me');
        const basic = me.profile?.basic ?? {};
        const academic = me.profile?.academic ?? {};

        // Load language tests from the dedicated endpoint (UserLanguageTest model)
        type LangTestLoaded = { id: string; test_name: string; overall_score: string | number };
        let langTests: LangTestLoaded[] = [];
        try {
          const ltResp = await apiGet<{ data?: LangTestLoaded[] } | LangTestLoaded[]>('/language-tests');
          langTests = (ltResp as { data?: LangTestLoaded[] }).data ?? (ltResp as LangTestLoaded[]);
        } catch { /* no tests yet */ }

        // 2. Preferences
        // GET returns: { countries, fields_of_study, budget_preference, preferred_start_year }
        type PrefsData = {
          countries?: string[] | null;
          fields_of_study?: string[] | null;
          budget_preference?: string | null;
          preferred_start_year?: number | null;
        };
        let prefs: PrefsData = {};
        try {
          const prefsResp = await apiGet<{ data?: PrefsData } | PrefsData>('/preferences');
          // unwrap { data: {...} } envelope if present
          prefs = (prefsResp as { data?: PrefsData }).data ?? (prefsResp as PrefsData);
        } catch { /* optional */ }

        // 3. Document readiness
        // GET returns: { data: { documents: [{document_type, is_ready}] } }
        type DocEntry = { document_type: string; is_ready: boolean };
        type DocReadiness = { data?: { documents?: DocEntry[] }; documents?: DocEntry[] };
        let docsArr: DocEntry[] = [];
        try {
          const docResp = await apiGet<DocReadiness>('/documents/readiness');
          docsArr = docResp?.data?.documents ?? docResp?.documents ?? [];
        } catch { /* optional */ }

        const docMap = Object.fromEntries(docsArr.map(d => [d.document_type, d.is_ready]));
        // Backward compatibility: old records may only have major saved.
        const majorParts = (academic.major ?? '').split(' | ');

        setProfile(prev => ({
          ...prev,
          fullName: [basic.first_name, basic.last_name].filter(Boolean).join(' ') || prev.fullName,
          nationality: basic.nationality ?? '',
          currentCountry: basic.current_country ?? '',
          currentDegree: fromBackendDegree(academic.degree_level),
          targetDegree: fromBackendDegree(academic.target_degree),
          gpa: academic.gpa != null ? String(academic.gpa) : '',
          fieldOfStudy: academic.field_of_study ?? majorParts[0] ?? '',
          subField: academic.sub_field ?? majorParts[1] ?? '',
          preferredCountries: prefs.countries ?? [],
          preferredFields: prefs.fields_of_study ?? [],
          budgetPreference: prefs.budget_preference ?? '',
          preferredStartYear: prefs.preferred_start_year ? String(prefs.preferred_start_year) : '',
          expectedStartYear: academic.expected_start_year ? String(academic.expected_start_year) : '',
          applicationStatus: academic.application_status ?? '',
          languageTests: langTests.length > 0
            ? langTests.map(l => ({
                id: l.id,
                testType: fromBackendTestName(l.test_name),
                overallScore: String(l.overall_score),
                showAdvanced: false,
              }))
            : prev.languageTests,
          documents: {
            cvUploaded:           docMap['cv'] ?? false,
            motivationLetter:     docMap['motivation_letter'] ?? false,
            recommendationLetter: docMap['recommendation_letter'] ?? false,
            transcript:           docMap['transcript'] ?? false,
            passportReady:        docMap['passport'] ?? false,
          },
        }));
      } catch (err) {
        // Don't show error if user just has no profile yet — that's normal
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('404') && !msg.includes('No query results')) {
          toast.error('Gagal memuat data profil.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

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
    const fieldOfStudy = profile.fieldOfStudy.trim();
    const subField = profile.subField.trim();
    const gpaValue = profile.gpa ? parseFloat(profile.gpa) : NaN;

    if (!profile.fullName.trim() || !profile.nationality || !profile.currentCountry) {
      toast.error('Mohon lengkapi semua data profil dasar.');
      return;
    }

    if (!profile.currentDegree || !profile.targetDegree || !fieldOfStudy) {
      toast.error('Mohon lengkapi semua data akademik.');
      return;
    }

    if (Number.isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) {
      toast.error('IPK harus berupa angka antara 0.00 sampai 4.00.');
      return;
    }

    setIsSaving(true);

    try {
      // ── 1. Split fullName into first/last ──────────────────────────────
      const nameParts = profile.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') || firstName; // fallback to firstName if single word

      // ── 2. Persist canonical field_of_study and keep major for compatibility ──
      const major = fieldOfStudy;

      // ── 3. Save core profile (basic + academic in one PUT) ─────────────
      await apiPut('/profile/', {
        first_name: firstName,
        last_name: lastName,
        nationality: profile.nationality || undefined,
        current_country: profile.currentCountry || undefined,
        gpa: gpaValue,
        field_of_study: fieldOfStudy || undefined,
        sub_field: subField || undefined,
        major: major || undefined,
        degree_level: profile.currentDegree ? toBackendDegree(profile.currentDegree) : undefined,
        target_degree: profile.targetDegree ? toBackendDegree(profile.targetDegree) : undefined,
        expected_start_year: profile.expectedStartYear ? parseInt(profile.expectedStartYear) : undefined,
        application_status: profile.applicationStatus || undefined,
      });

      // ── 4. Save preferences ────────────────────────────────────────────
      // PUT /api/preferences expects: { countries, fields_of_study, budget_preference, preferred_start_year }
      if (profile.preferredCountries.length || profile.preferredFields.length || profile.budgetPreference) {
        await apiPut('/preferences/', {
          countries: profile.preferredCountries,
          fields_of_study: profile.preferredFields,
          budget_preference: profile.budgetPreference || undefined,
          preferred_start_year: profile.preferredStartYear ? parseInt(profile.preferredStartYear) : undefined,
        });
      }

      // ── 5. Save document readiness ─────────────────────────────────────
      // PUT /api/documents/readiness expects: { documents: ["cv", "transcript", ...] }
      const checkedDocs: string[] = [];
      if (profile.documents.cvUploaded)           checkedDocs.push('cv');
      if (profile.documents.motivationLetter)     checkedDocs.push('motivation_letter');
      if (profile.documents.recommendationLetter) checkedDocs.push('recommendation_letter');
      if (profile.documents.transcript)           checkedDocs.push('transcript');
      if (profile.documents.passportReady)        checkedDocs.push('passport');
      await apiPut('/documents/readiness', { documents: checkedDocs });

      // ── 6. Sync language tests ─────────────────────────────────────────
      // GET /api/language-tests returns: { data: [{id, test_name, overall_score, ...}] }
      // POST /api/language-tests expects: { test_name, overall_score, test_date } (validated enum)
      // We store the LanguageTestCard's testType as a display name; map to backend enum
      const TEST_NAME_MAP: Record<string, string> = {
        'IELTS': 'ielts',
        'TOEFL': 'toefl_ibt',
        'Duolingo': 'duolingo',
        'ielts': 'ielts',
        'toefl_ibt': 'toefl_ibt',
        'duolingo': 'duolingo',
      };

      type LangTestRaw = { id: string; test_name: string; overall_score: string };
      let existingLangs: LangTestRaw[] = [];
      try {
        const resp = await apiGet<{ data?: LangTestRaw[] } | LangTestRaw[]>('/language-tests');
        existingLangs = (resp as { data?: LangTestRaw[] }).data ?? (resp as LangTestRaw[]);
      } catch { /* fresh user without tests */ }

      const validTests = profile.languageTests.filter(t => t.testType && t.overallScore);

      for (const test of validTests) {
        const backendTestName = TEST_NAME_MAP[test.testType];
        if (!backendTestName) continue; // skip unknown test types — don't block save

        const payload = {
          test_name: backendTestName,
          overall_score: parseFloat(test.overallScore),
          test_date: new Date().toISOString().split('T')[0], // today as fallback
        };

        const existingLang = existingLangs.find(l => l.id === test.id);
        if (existingLang) {
          try { await apiPut(`/language-tests/${test.id}`, payload); } catch { /* best-effort */ }
        } else {
          try {
            const created = await apiPost<LangTestRaw>('/language-tests/', payload);
            setProfile(prev => ({
              ...prev,
              languageTests: prev.languageTests.map(t =>
                t.id === test.id ? { ...t, id: created.id } : t
              ),
            }));
          } catch { /* skip unknown tests */ }
        }
      }

      // Delete removed tests
      for (const existingLang of existingLangs) {
        const stillPresent = validTests.some(t => t.id === existingLang.id);
        if (!stillPresent) {
          try { await apiDelete(`/language-tests/${existingLang.id}`); } catch { /* best-effort */ }
        }
      }

      toast.success('Profil berhasil disimpan!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
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
      toast.error('Semua kolom kata sandi wajib diisi');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast.error('Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan karakter khusus');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await apiPut('/user/password', {
        current_password: passwordData.currentPassword,
        password: passwordData.newPassword,
        password_confirmation: passwordData.confirmPassword,
      });

      toast.success('Kata sandi berhasil diperbarui!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Memuat profil kamu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4" style={{ maxWidth: '800px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profil Pengguna</h1>
          <p className="text-muted-foreground">
            Lengkapi profilmu untuk mendapatkan rekomendasi beasiswa yang lebih personal
          </p>
        </div>

        {/* Profile Completion Banner */}
        <ProfileCompletionBanner profile={profile} />

        <div className="space-y-6">
          {/* 1. Change Password */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Ubah Kata Sandi</CardTitle>
              <CardDescription>
                Perbarui kata sandi untuk menjaga keamanan akunmu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Masukkan kata sandi saat ini"
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
                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Masukkan kata sandi baru"
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
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Konfirmasi kata sandi baru"
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
                  Lupa Kata Sandi?
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
                  Batal
                </Button>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword}
                  size="sm"
                >
                  {isUpdatingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Basic Information */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
              <CardDescription>
                Data pribadi dan lokasi kamu saat ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap *</Label>
                <Input
                  id="fullName"
                  value={profile.fullName}
                  onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Nationality + Current Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Kewarganegaraan *</Label>
                  <Select
                    value={profile.nationality}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, nationality: value }))}
                  >
                    <SelectTrigger id="nationality">
                      <SelectValue placeholder="Pilih kewarganegaraan" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentCountry">Negara Saat Ini *</Label>
                  <Select
                    value={profile.currentCountry}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, currentCountry: value }))}
                  >
                    <SelectTrigger id="currentCountry">
                      <SelectValue placeholder="Pilih negara" />
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
              <CardTitle>Latar Belakang Akademik</CardTitle>
              <CardDescription>
                Jenjang pendidikan dan bidang studi kamu saat ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Degree + Target Degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentDegree">Jenjang Saat Ini *</Label>
                  <Select
                    value={profile.currentDegree}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, currentDegree: value }))}
                  >
                    <SelectTrigger id="currentDegree">
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">SMA</SelectItem>
                      <SelectItem value="bachelor">S1 / Sarjana</SelectItem>
                      <SelectItem value="master">S2 / Magister</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDegree">Jenjang Tujuan *</Label>
                  <Select
                    value={profile.targetDegree}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, targetDegree: value }))}
                  >
                    <SelectTrigger id="targetDegree">
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">S1 / Sarjana</SelectItem>
                      <SelectItem value="master">S2 / Magister</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Field of Study */}
              <div className="space-y-2">
                <Label htmlFor="fieldOfStudy">Bidang Studi *</Label>
                <Select
                  value={profile.fieldOfStudy}
                  onValueChange={(value: string) => setProfile(prev => ({ ...prev, fieldOfStudy: value }))}
                >
                  <SelectTrigger id="fieldOfStudy">
                    <SelectValue placeholder="Pilih bidang studi" />
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
                <Label htmlFor="subField">Sub Bidang (Opsional)</Label>
                <Input
                  id="subField"
                  value={profile.subField}
                  onChange={(e) => setProfile(prev => ({ ...prev, subField: e.target.value }))}
                  placeholder="contoh: Machine Learning, Hukum Perusahaan, dll."
                />
              </div>

              {/* GPA */}
              <div className="space-y-2">
                <Label htmlFor="gpa">IPK *</Label>
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
              <CardTitle>Preferensi</CardTitle>
              <CardDescription>
                Preferensi beasiswa dan studi kamu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preferred Countries */}
              <div className="space-y-2">
                <Label htmlFor="preferredCountries">Negara Tujuan</Label>
                <Select onValueChange={toggleCountry}>
                  <SelectTrigger id="preferredCountries">
                    <SelectValue placeholder="Pilih negara" />
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
                <Label htmlFor="preferredFields">Bidang Favorit</Label>
                <Select onValueChange={toggleField}>
                  <SelectTrigger id="preferredFields">
                    <SelectValue placeholder="Pilih bidang" />
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
                  <Label htmlFor="budgetPreference">Preferensi Pendanaan *</Label>
                  <Select
                    value={profile.budgetPreference}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, budgetPreference: value }))}
                  >
                    <SelectTrigger id="budgetPreference">
                      <SelectValue placeholder="Pilih pendanaan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_scholarship">Beasiswa Penuh</SelectItem>
                      <SelectItem value="partial_scholarship">Beasiswa Parsial</SelectItem>
                      <SelectItem value="self_funded">Biaya Mandiri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredStartYear">Tahun Mulai yang Diinginkan *</Label>
                  <Select
                    value={profile.preferredStartYear}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, preferredStartYear: value }))}
                  >
                    <SelectTrigger id="preferredStartYear">
                      <SelectValue placeholder="Pilih tahun" />
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
              <CardTitle>Tes Bahasa</CardTitle>
              <CardDescription>
                Tambahkan nilai tes kemampuan bahasa Inggris
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
                Tambah Tes Bahasa
              </Button>
            </CardContent>
          </Card>

          {/* 6. Documents Readiness */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Kesiapan Dokumen</CardTitle>
              <CardDescription>
                Centang dokumen yang sudah kamu siapkan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cvUploaded"
                    checked={profile.documents.cvUploaded}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, cvUploaded: checked === true }
                      }))
                    }
                  />
                  <label
                    htmlFor="cvUploaded"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    CV Sudah Diunggah
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="motivationLetter"
                    checked={profile.documents.motivationLetter}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, motivationLetter: checked === true }
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
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, recommendationLetter: checked === true }
                      }))
                    }
                  />
                  <label
                    htmlFor="recommendationLetter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Surat Rekomendasi
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transcript"
                    checked={profile.documents.transcript}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, transcript: checked === true }
                      }))
                    }
                  />
                  <label
                    htmlFor="transcript"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Transkrip
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passportReady"
                    checked={profile.documents.passportReady}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setProfile(prev => ({
                        ...prev,
                        documents: { ...prev.documents, passportReady: checked === true }
                      }))
                    }
                  />
                  <label
                    htmlFor="passportReady"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Paspor Siap
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7. Application Status */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Status Pendaftaran</CardTitle>
              <CardDescription>
                Timeline dan status pendaftaran kamu saat ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedStartYear">Perkiraan Tahun Mulai *</Label>
                  <Select
                    value={profile.expectedStartYear}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, expectedStartYear: value }))}
                  >
                    <SelectTrigger id="expectedStartYear">
                      <SelectValue placeholder="Pilih tahun" />
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
                  <Label htmlFor="applicationStatus">Status Pendaftaran *</Label>
                  <Select
                    value={profile.applicationStatus}
                    onValueChange={(value: string) => setProfile(prev => ({ ...prev, applicationStatus: value }))}
                  >
                    <SelectTrigger id="applicationStatus">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Belum Mulai</SelectItem>
                      <SelectItem value="preparing">Sedang Persiapan</SelectItem>
                      <SelectItem value="ready">Siap Mendaftar</SelectItem>
                      <SelectItem value="applied">Sudah Mendaftar</SelectItem>
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
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-none sm:px-8"
            >
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}