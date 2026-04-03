# User Profile Page - Documentation

## Overview

The **User Profile Page** is a comprehensive form-based interface that allows users to input and manage their personal information, academic background, preferences, language test scores, document readiness, and application status for scholarship applications.

## Component Location

- **Main Component:** `/components/profile/UserProfilePage.tsx`
- **Sub-component:** `/components/profile/LanguageTestCard.tsx`
- **Route:** `/profile` (protected route, requires authentication)
- **Access:** Header dropdown menu → Profile

## Page Specifications

### Layout
- **Page Width:** 1440px (full viewport)
- **Container Max Width:** 800px (centered)
- **Section Spacing:** 24px between cards
- **Card Padding:** 24px
- **Border Radius:** 16px (rounded-2xl)
- **Background:** White card with soft shadow

### Visual Hierarchy
- **Page Title:** 32px (text-3xl), Bold
- **Section Titles:** 18px (text-xl), Bold
- **Section Descriptions:** 14px (text-sm), Muted foreground
- **Labels:** 14px (text-sm), Medium weight
- **Input Fields:** Standard height with consistent padding

---

## Sections Breakdown

### 1. Basic Information

**Purpose:** Capture user's fundamental personal details

**Fields:**
- **Full Name*** (text input, required)
  - Type: `string`
  - Full width
  - Pre-populated from auth context
  
- **Nationality*** (dropdown, required)
  - Type: `string`
  - Options: List of countries
  - Half width (2-column grid on desktop)
  
- **Current Country*** (dropdown, required)
  - Type: `string`
  - Options: List of countries
  - Half width (2-column grid on desktop)

**Layout:** 
- Full width for Full Name
- Two columns for Nationality + Current Country on desktop
- Single column on mobile

---

### 2. Academic Background

**Purpose:** Collect educational history and goals

**Fields:**
- **Current Degree*** (dropdown, required)
  - Type: `'high-school' | 'bachelor' | 'master' | 'phd'`
  - Options: High School, Bachelor's Degree, Master's Degree, PhD
  - Half width
  
- **Target Degree*** (dropdown, required)
  - Type: `'bachelor' | 'master' | 'phd'`
  - Options: Bachelor's Degree, Master's Degree, PhD
  - Half width
  
- **Field of Study*** (dropdown, required)
  - Type: `string`
  - Options: Computer Science, Engineering, Business, Medicine, etc.
  - Full width
  
- **Sub Field** (text input, optional)
  - Type: `string`
  - Placeholder: "e.g., Machine Learning, Corporate Law, etc."
  - Full width
  
- **GPA*** (number input, required)
  - Type: `number`
  - Range: 0.00 - 4.00
  - Step: 0.01
  - Placeholder: "0.00 - 4.00"
  - Full width

**Layout:**
- Two columns for Current Degree + Target Degree
- Full width for Field of Study, Sub Field, GPA

---

### 3. Preferences

**Purpose:** Understand user's scholarship and study preferences

**Fields:**
- **Preferred Countries** (multi-select dropdown)
  - Type: `string[]`
  - Display as tags/badges
  - Removable by clicking X icon
  - Full width
  
- **Preferred Fields** (multi-select dropdown)
  - Type: `string[]`
  - Display as tags/badges
  - Removable by clicking X icon
  - Full width
  
- **Budget Preference*** (dropdown, required)
  - Type: `'full' | 'partial' | 'self-funded'`
  - Options: Full Scholarship, Partial Scholarship, Self-funded
  - Half width
  
- **Preferred Start Year*** (dropdown, required)
  - Type: `number`
  - Options: 2025, 2026, 2027, 2028
  - Half width

**Multi-select Behavior:**
- Select from dropdown to add
- Display as badges with remove button
- Already selected items hidden from dropdown

---

### 4. Language Tests

**Purpose:** Record English proficiency test scores

**Component:** `LanguageTestCard` (repeatable)

**Each Test Card Contains:**
- **Test Type*** (dropdown, required)
  - Options: IELTS, TOEFL iBT, Duolingo English Test
  
- **Overall Score*** (number input, required)
  - IELTS/Duolingo: 0.0 - 9.0 (step 0.5)
  - TOEFL: 0 - 120 (step 1)
  - Range adjusts based on test type
  
- **Show Detailed Scores** (toggle switch)
  - When enabled, shows 4 additional fields:
    - Listening (number)
    - Reading (number)
    - Writing (number)
    - Speaking (number)
  - Each uses same range as overall score

**Features:**
- **Add Multiple Tests:** "+ Add Language Test" button
- **Remove Tests:** X button on each card (disabled if only 1 test)
- **Responsive Grid:** 4 columns for detailed scores on desktop, 2 on mobile

**Card Styling:**
- Background: Card background
- Border: Standard card border
- Padding: 24px
- Border Radius: 16px (rounded-2xl)

---

### 5. Documents Readiness

**Purpose:** Track which application documents user has prepared

**Fields:** (all checkboxes, boolean values)
- CV Uploaded
- Motivation Letter
- Recommendation Letter
- Transcript
- Passport Ready

**Layout:**
- Vertical stack
- 12px spacing between items
- Checkbox + label on same line
- Cursor pointer on labels for better UX

**Data Structure:**
```typescript
documents: {
  cvUploaded: boolean;
  motivationLetter: boolean;
  recommendationLetter: boolean;
  transcript: boolean;
  passportReady: boolean;
}
```

---

### 6. Application Status

**Purpose:** Capture timeline and readiness level

**Fields:**
- **Expected Start Year*** (dropdown, required)
  - Type: `number`
  - Options: 2025, 2026, 2027, 2028
  - Half width
  
- **Application Status*** (dropdown, required)
  - Type: `'not-started' | 'preparing' | 'ready' | 'applied'`
  - Options: Not Started, Preparing, Ready to Apply, Applied
  - Half width

**Layout:** Two-column grid on desktop, single column on mobile

---

## Action Buttons

### Save Changes (Primary Button)
- Icon: Save icon
- Text: "Save Changes" (changes to "Saving..." during submission)
- Disabled during save operation
- Min width on desktop: 200px (px-8)
- Full width on mobile

### Cancel (Secondary Button)
- Variant: Outline
- Text: "Cancel"
- Action: Navigate to /dashboard
- Disabled during save operation
- Min width on desktop: 200px (px-8)
- Full width on mobile

**Layout:**
- Flex row on desktop
- Flex column on mobile
- 12px gap between buttons
- 24px top padding from last section

---

## Data Structure

### Complete Interface

```typescript
interface UserProfile {
  // Basic Information
  fullName: string;
  nationality: string;
  currentCountry: string;

  // Academic Background
  currentDegree: 'high-school' | 'bachelor' | 'master' | 'phd';
  targetDegree: 'bachelor' | 'master' | 'phd';
  fieldOfStudy: string;
  subField?: string;
  gpa: number; // 0.00 - 4.00

  // Preferences
  preferredCountries: string[];
  preferredFields: string[];
  budgetPreference: 'full' | 'partial' | 'self-funded';
  preferredStartYear: number;

  // Language Tests
  languageTests: LanguageTest[];

  // Documents Readiness
  documents: {
    cvUploaded: boolean;
    motivationLetter: boolean;
    recommendationLetter: boolean;
    transcript: boolean;
    passportReady: boolean;
  };

  // Application Status
  expectedStartYear: number;
  applicationStatus: 'not-started' | 'preparing' | 'ready' | 'applied';
}

interface LanguageTest {
  id: string;
  testType: 'IELTS' | 'TOEFL' | 'Duolingo' | '';
  overallScore: number;
  showAdvanced: boolean;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
}
```

---

## Form Validation

### Required Fields (marked with *)
1. Full Name
2. Nationality
3. Current Country
4. Current Degree
5. Target Degree
6. Field of Study
7. GPA
8. Budget Preference
9. Preferred Start Year
10. Expected Start Year
11. Application Status
12. At least one Language Test (Test Type + Overall Score)

### Validation Rules

**GPA:**
- Min: 0.00
- Max: 4.00
- Step: 0.01

**Language Test Scores:**
- IELTS: 0.0 - 9.0 (step 0.5)
- TOEFL: 0 - 120 (step 1)
- Duolingo: 0.0 - 9.0 (step 0.5)

**Future Enhancements:**
- Add client-side validation before save
- Display error messages for invalid fields
- Highlight invalid fields in red
- Prevent form submission if validation fails

---

## User Experience Features

### Auto-save (Future)
- Save draft every 30 seconds
- Show "Draft saved" indicator
- Prevent data loss on accidental navigation

### Pre-fill from Auth
- Full Name automatically populated from user context
- Email shown in header but not editable

### Progressive Disclosure
- Language test detailed scores hidden by default
- Toggle to show/hide advanced fields
- Reduces cognitive load

### Multi-select UX
- Visual feedback with badges
- Easy removal with X button
- Clear indication of selected items

### Responsive Design
- 2-column grid on desktop (≥768px)
- Single column on mobile (<768px)
- Touch-friendly targets on mobile
- Proper spacing for small screens

---

## Backend Integration (Future)

### API Endpoints

**GET** `/api/users/:userId/profile`
```json
{
  "fullName": "John Doe",
  "nationality": "Indonesia",
  "currentCountry": "Indonesia",
  "currentDegree": "bachelor",
  "targetDegree": "master",
  "fieldOfStudy": "Computer Science",
  "subField": "Machine Learning",
  "gpa": 3.85,
  "preferredCountries": ["United States", "United Kingdom"],
  "preferredFields": ["Computer Science", "Engineering"],
  "budgetPreference": "full",
  "preferredStartYear": 2026,
  "languageTests": [
    {
      "id": "1",
      "testType": "IELTS",
      "overallScore": 7.5,
      "showAdvanced": true,
      "listening": 8.0,
      "reading": 7.5,
      "writing": 7.0,
      "speaking": 7.5
    }
  ],
  "documents": {
    "cvUploaded": true,
    "motivationLetter": true,
    "recommendationLetter": false,
    "transcript": true,
    "passportReady": true
  },
  "expectedStartYear": 2026,
  "applicationStatus": "preparing"
}
```

**PUT** `/api/users/:userId/profile`
- Same structure as GET response
- Returns updated profile
- 200 OK on success

### Supabase Schema

```sql
-- users table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  current_country TEXT NOT NULL,
  current_degree TEXT NOT NULL,
  target_degree TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  sub_field TEXT,
  gpa DECIMAL(3, 2) NOT NULL CHECK (gpa >= 0 AND gpa <= 4),
  preferred_countries TEXT[],
  preferred_fields TEXT[],
  budget_preference TEXT NOT NULL,
  preferred_start_year INTEGER NOT NULL,
  expected_start_year INTEGER NOT NULL,
  application_status TEXT NOT NULL,
  cv_uploaded BOOLEAN DEFAULT false,
  motivation_letter BOOLEAN DEFAULT false,
  recommendation_letter BOOLEAN DEFAULT false,
  transcript BOOLEAN DEFAULT false,
  passport_ready BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- language_tests table
CREATE TABLE language_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  overall_score DECIMAL(4, 1) NOT NULL,
  listening DECIMAL(4, 1),
  reading DECIMAL(4, 1),
  writing DECIMAL(4, 1),
  speaking DECIMAL(4, 1),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Accessibility

✅ **Keyboard Navigation**
- All form fields accessible via Tab
- Enter to submit
- Escape to cancel

✅ **Screen Readers**
- Proper labels for all inputs
- ARIA labels for icon buttons
- Descriptive error messages

✅ **Visual Indicators**
- Required fields marked with *
- Focus states on all interactive elements
- High contrast for text and backgrounds

✅ **Touch Targets**
- Minimum 44x44px for mobile
- Adequate spacing between elements

---

## Testing Checklist

### Functional Tests
- [ ] Form loads with user's name pre-filled
- [ ] All dropdowns populate correctly
- [ ] Multi-select adds/removes items properly
- [ ] Language test cards can be added/removed
- [ ] Advanced toggle shows/hides detailed scores
- [ ] Save button triggers save action
- [ ] Cancel button navigates to dashboard
- [ ] Toast notification appears on save
- [ ] Form validates required fields

### Responsive Tests
- [ ] 800px max-width container centers properly
- [ ] Two-column grids switch to single column on mobile
- [ ] Buttons stack vertically on mobile
- [ ] All text is readable on small screens
- [ ] Touch targets are adequate size

### Integration Tests
- [ ] Profile data persists after save
- [ ] Navigation doesn't lose unsaved changes (with warning)
- [ ] Authentication state affects access
- [ ] Header link navigates correctly

---

## Future Enhancements

### Short Term
1. Add field validation with error messages
2. Implement auto-save functionality
3. Add "unsaved changes" warning on navigation
4. Add profile completion percentage indicator

### Medium Term
1. Connect to Supabase backend
2. Add file upload for documents
3. Add profile photo upload
4. Export profile as PDF

### Long Term
1. AI-powered scholarship matching based on profile
2. Profile analytics and recommendations
3. Import data from LinkedIn/Resume
4. Multi-language support (Indonesian + English)

---

## Related Files

- `/components/profile/UserProfilePage.tsx` - Main component
- `/components/profile/LanguageTestCard.tsx` - Repeatable test component
- `/routes.ts` - Route configuration
- `/components/Header.tsx` - Navigation link
- `/lib/auth-context.tsx` - User authentication

---

## Developer Notes

### Field Naming Convention
Use camelCase for JavaScript/TypeScript, snake_case for database fields.

### State Management
Currently using local React state. Consider:
- React Context for global profile state
- Zustand for more complex state management
- React Query for server state synchronization

### Performance
- Language test cards re-render optimized with unique IDs
- Multi-select uses efficient array operations
- Form doesn't re-render entire page on single field change

### Code Organization
```
/components/profile/
  ├── UserProfilePage.tsx          # Main page component
  ├── LanguageTestCard.tsx         # Repeatable test card
  ├── USER_PROFILE_README.md       # This documentation
  └── [future components]
```

---

**Last Updated:** April 3, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete and Ready for Use
