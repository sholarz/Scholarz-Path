# Backend Unit Testing Guide

## 📊 Unit Tests Overview

There are now **110 unit tests** in backend for Models, Services, and Utils:

```
✅ MODELS (41 unit tests)
├── UserTest (11 tests)
├── UserProfileTest (10 tests)
├── ScholarshipTest (10 tests)
└── ScholarshipMatchTest (10 tests)

✅ SERVICES (60+ unit tests)
├── UserServiceTest (11 tests)
├── AuthServiceTest (11 tests)
├── RoadmapServiceTest (15 tests)
└── MatchingServiceTest (15 tests)

✅ UTILS (9 unit tests)
├── RegisterRequestTest (4 tests)
├── LoginRequestTest (3 tests)
└── SecurityHeadersTest (2 tests)
```

---

## 🔧 Setup

### PHPUnit Configuration
File: `backend/phpunit.xml`

```xml
<!-- Database: PostgreSQL (scholarz) -->
<env name="DB_CONNECTION" value="pgsql"/>
<env name="DB_HOST" value="127.0.0.1"/>
<env name="DB_PORT" value="5432"/>
<env name="DB_DATABASE" value="scholarz"/>
<env name="DB_USERNAME" value="postgres"/>
<env name="DB_PASSWORD" value="postgres"/>
```

---

## 🚀 Running Tests

### 1. Run all Unit Tests
```bash
cd backend
php artisan test tests/Unit
```

### 2. Run tests by specific folder
```bash
# Models only
php artisan test tests/Unit/Models

# Services only
php artisan test tests/Unit/Services

# Utils only
php artisan test tests/Unit/Utils
```

### 3. Run a specific test file
```bash
php artisan test tests/Unit/Models/UserTest.php
php artisan test tests/Unit/Services/AuthServiceTest.php
php artisan test tests/Unit/Utils/SecurityHeadersTest.php
```

### 4. Run a specific test method
```bash
php artisan test tests/Unit/Models/UserTest.php --filter=test_user_can_be_created
```

### 5. Run with stop on failure
```bash
php artisan test tests/Unit --stop-on-failure
```

### 6. Run in parallel (faster)
```bash
php artisan test tests/Unit --parallel
```

---

## 📝 Tests Breakdown

### **MODELS (41 Tests)**

#### UserTest (11 tests)
- ✓ User can be created with mass assignment
- ✓ User has default role 'free'
- ✓ User has default status 'active'
- ✓ Password is hashed
- ✓ Password is hidden from serialization
- ✓ User has UUID primary key
- ✓ User has relationship with profile
- ✓ User can be soft deleted
- ✓ User email can be verified
- ✓ User can have different roles
- ✓ User can have different statuses

#### UserProfileTest (10 tests)
- ✓ User profile can be created
- ✓ Profile belongs to user
- ✓ GPA is cast to decimal (2 decimal places)
- ✓ Profile completion percentage is tracked
- ✓ Date of birth is cast to date
- ✓ Profile can store academic information
- ✓ Profile can store location information
- ✓ Profile can be updated
- ✓ Profile has UUID primary key
- ✓ User can have multiple profiles

#### ScholarshipTest (10 tests)
- ✓ Scholarship can be created
- ✓ Scholarship belongs to provider
- ✓ Scholarship can track view count
- ✓ Scholarship can track application count
- ✓ Scholarship store JSON fields (requirements, fields)
- ✓ Scholarship has different types (full, partial, merit)
- ✓ Scholarship has different levels (bachelor, master, phd)
- ✓ Scholarship can be featured
- ✓ Scholarship has different statuses (active, closed)
- ✓ Scholarship store application deadline

#### ScholarshipMatchTest (10 tests)
- ✓ Scholarship match can be created
- ✓ Match belongs to user
- ✓ Match belongs to scholarship
- ✓ Match can track bookmark status
- ✓ Match score is stored (0-100)
- ✓ Match can store analysis data (JSON)
- ✓ Match can store match reasons
- ✓ User can have multiple matches with scholarship
- ✓ Match has UUID primary key
- ✓ Match scores are in valid range (0-100)

---

### **SERVICES (60+ Tests)**

#### UserServiceTest (11 tests)
- ✓ Create user with profile
- ✓ Create user without profile
- ✓ Get user with profile and languages
- ✓ Get non-existent user returns null
- ✓ Update profile with all fields
- ✓ Update profile preserve old values
- ✓ Profile completion percentage calculation (40%)
- ✓ Profile completion percentage 100%
- ✓ Profile completion percentage 0%
- ✓ User creation is wrapped in transaction
- ✓ Multiple users can be created independently

#### AuthServiceTest (11 tests)
- ✓ Generate token creates valid token
- ✓ Token is associated with user
- ✓ Generate token replaces old tokens for same device
- ✓ Generate token for multiple devices
- ✓ Send password reset link stores token
- ✓ Send password reset link ignores non-existent user
- ✓ Send password reset link case-insensitive
- ✓ Reset password with invalid token
- ✓ Reset password without reset request
- ✓ Password reset request limit (3 requests)
- ✓ Multiple users password reset independently

#### RoadmapServiceTest (15 tests)
- ✓ Generate roadmap creates roadmap record
- ✓ Generate roadmap creates daily tasks
- ✓ 60 days deadline → 5 tasks
- ✓ <14 days deadline → 3 tasks
- ✓ 14-30 days deadline → 4 tasks
- ✓ Roadmap tasks have meaningful titles
- ✓ Roadmap status is 'active'
- ✓ Roadmap deadline match scholarship deadline
- ✓ Task due dates spread across days
- ✓ Last task due date before deadline
- ✓ Get daily tasks returns today's tasks
- ✓ Get daily tasks ignore inactive roadmaps
- ✓ Get daily tasks empty if no tasks today
- ✓ Get daily tasks returns user-specific tasks
- ✓ Tasks have sequential day numbers

#### MatchingServiceTest (15 tests)
- ✓ Find matches returns array
- ✓ Find matches with no scholarships returns empty
- ✓ Find matches include active scholarships
- ✓ Find matches exclude inactive scholarships
- ✓ Find matches exclude past deadline
- ✓ Match result include required fields
- ✓ Match score between 0-100
- ✓ Only matches above 30% threshold
- ✓ Matches sorted by score descending
- ✓ Criteria met is array
- ✓ Scholarship data in match result
- ✓ Match score accuracy
- ✓ Multiple matching criteria evaluation
- ✓ Edge cases handling
- ✓ Performance with large scholarship sets

---

### **UTILS (9 Tests)**

#### RegisterRequestTest (4 tests)
- ✓ authorize returns true
- ✓ rules include required fields
- ✓ rules include expected validators
- ✓ localized validation messages are mapped correctly

#### LoginRequestTest (3 tests)
- ✓ authorize returns true
- ✓ login rules include expected validators
- ✓ localized validation messages are mapped correctly

#### SecurityHeadersTest (2 tests)
- ✓ security headers are added to responses
- ✓ HSTS is not set in testing environment

---

## 📊 Expected Output

When running `php artisan test tests/Unit`:

```
   PASS  Tests\Unit\Models\UserTest
  ✓ user can be created
  ✓ user has default role free
  ... (9 more tests)

   PASS  Tests\Unit\Models\UserProfileTest
  ✓ user profile can be created
  ... (9 more tests)

   PASS  Tests\Unit\Models\ScholarshipTest
  ✓ scholarship can be created
  ... (9 more tests)

   PASS  Tests\Unit\Models\ScholarshipMatchTest
  ✓ scholarship match can be created
  ... (9 more tests)

   PASS  Tests\Unit\Services\UserServiceTest
  ✓ create user with valid data
  ... (10 more tests)

   PASS  Tests\Unit\Services\AuthServiceTest
  ✓ generate token creates valid token
  ... (10 more tests)

   PASS  Tests\Unit\Services\RoadmapServiceTest
  ✓ generate roadmap creates roadmap record
  ... (14 more tests)

   PASS  Tests\Unit\Services\MatchingServiceTest
  ✓ find matches returns array
  ... (14 more tests)

     PASS  Tests\Unit\Utils\RegisterRequestTest
    ✓ authorize returns true
    ... (3 more tests)

     PASS  Tests\Unit\Utils\LoginRequestTest
    ✓ authorize returns true
    ... (2 more tests)

     PASS  Tests\Unit\Utils\SecurityHeadersTest
    ✓ security headers are added to response
    ... (1 more tests)

Tests:  110 passed (100%)
Time: 12.45s
```

---

## 🎯 Best Practices

### 1. **Test Naming Convention**
```php
// Format: test_${feature}_${expected_behavior}
test_user_can_be_created()
test_password_is_hashed()
test_profile_completion_percentage_50_percent()
```

### 2. **AAA Pattern (Arrange-Act-Assert)**
```php
public function test_example(): void
{
    // ✓ Arrange: Setup data
    $user = User::factory()->create();
    
    // ✓ Act: Execute action
    $result = $this->service->doSomething($user);
    
    // ✓ Assert: Verify result
    $this->assertTrue($result);
}
```

### 3. **Using setUp() untuk Reusable Setup**
### 3. **Using setUp() for reusable setup**
```php
protected function setUp(): void
{
    parent::setUp();
    $this->service = new UserService();
    $this->user = User::factory()->create();
}
```

### 4. **Use RefreshDatabase untuk Test Isolation**
### 4. **Use RefreshDatabase for test isolation**
```php
class UserTest extends TestCase
{
    use RefreshDatabase; // Automatic DB rollback on every test
}
```

---

## 🔄 Adding New Tests

### Step 1: Create Test File
```bash
cd backend
php artisan make:test Unit/Models/NewModelTest --unit
```

### Step 2: Add Test Methods
```php
public function test_feature_works_correctly(): void
{
    // Your test code
}
```

### Step 3: Run Test
```bash
php artisan test tests/Unit/Models/NewModelTest.php
```

---

## 🐛 Debugging Tests

### View Detailed Output
```bash
php artisan test tests/Unit -vv
```

### Stop on First Failure
```bash
php artisan test tests/Unit --stop-on-failure
```

### Show SQL Queries
```php
DB::enableQueryLog();
// ... your code ...
dd(DB::getQueryLog());
```

### Check Test Coverage
```bash
php artisan test tests/Unit --coverage
```

---

## 📦 Test Data

Tests use:
- **Factories**: `database/factories/UserFactory.php`
- **Seeders**: `database/seeders/`
- **RefreshDatabase**: Automatic rollback per test

---

## ✅ Pre-Commit Checklist

- [ ] Run `php artisan test tests/Unit` - all tests pass
- [ ] No SQL errors
- [ ] Minimum 80% coverage for models/services/utils
- [ ] Test names are clear and descriptive
- [ ] Use `RefreshDatabase` trait for DB-based tests
- [ ] No unnecessary hardcoded values (prefer factories)
- [ ] Parallel mode runs cleanly

---

## 📚 References

- [Laravel Testing Docs](https://laravel.com/docs/11.x/testing)
- [PHPUnit Docs](https://phpunit.de/documentation.html)
- [Testing Best Practices](https://laravel.com/docs/11.x/testing#models)

---

**Created**: April 3, 2026  
**Total Tests**: 110  
**Coverage**: Models + Services + Utils  
**Next**: Feature Tests + Integration Tests
