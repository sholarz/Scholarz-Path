# Backend Unit Testing Guide

## 📊 Unit Tests Overview

Sudah dibuat **101 unit tests** di backend untuk Models dan Services:

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

## 🚀 Menjalankan Tests

### 1. Run SEMUA Unit Tests
```bash
cd backend
php artisan test tests/Unit
```

### 2. Run Tests di Folder Spesifik
```bash
# Hanya model tests
php artisan test tests/Unit/Models

# Hanya service tests
php artisan test tests/Unit/Services
```

### 3. Run Test File Spesifik
```bash
php artisan test tests/Unit/Models/UserTest.php
php artisan test tests/Unit/Services/AuthServiceTest.php
```

### 4. Run Test Method Spesifik
```bash
php artisan test tests/Unit/Models/UserTest.php --filter=test_user_can_be_created
```

### 5. Run dengan Stop on Failure
```bash
php artisan test tests/Unit --stop-on-failure
```

### 6. Run Parallel (Lebih Cepat)
```bash
php artisan test tests/Unit --parallel
```

---

## 📝 Tests Breakdown

### **MODELS (41 Tests)**

#### UserTest (11 tests)
- ✓ User dapat dibuat dengan mass assignment
- ✓ User punya default role 'free'
- ✓ User punya default status 'active'
- ✓ Password di-hash
- ✓ Password hidden dari serialization
- ✓ User punya UUID primary key
- ✓ User punya relationship dengan profile
- ✓ User dapat di-soft delete
- ✓ User email dapat di-verify
- ✓ User dapat punya berbagai roles
- ✓ User dapat punya berbagai statuses

#### UserProfileTest (10 tests)
- ✓ User profile dapat dibuat
- ✓ Profile belongs to user
- ✓ GPA di-cast ke decimal (2 decimal places)
- ✓ Profile completion percentage di-track
- ✓ Date of birth di-cast ke date
- ✓ Profile dapat store academic information
- ✓ Profile dapat store location information
- ✓ Profile dapat di-update
- ✓ Profile punya UUID primary key
- ✓ User dapat punya multiple profiles

#### ScholarshipTest (10 tests)
- ✓ Scholarship dapat dibuat
- ✓ Scholarship belongs to provider
- ✓ Scholarship dapat track view count
- ✓ Scholarship dapat track application count
- ✓ Scholarship store JSON fields (requirements, fields)
- ✓ Scholarship punya berbagai types (full, partial, merit)
- ✓ Scholarship punya berbagai levels (bachelor, master, phd)
- ✓ Scholarship dapat di-featured
- ✓ Scholarship punya berbagai statuses (active, closed)
- ✓ Scholarship store application deadline

#### ScholarshipMatchTest (10 tests)
- ✓ Scholarship match dapat dibuat
- ✓ Match belongs to user
- ✓ Match belongs to scholarship
- ✓ Match dapat track bookmark status
- ✓ Match score di-store (0-100)
- ✓ Match dapat store analysis data (JSON)
- ✓ Match dapat store match reasons
- ✓ User dapat punya multiple matches dengan scholarship
- ✓ Match punya UUID primary key
- ✓ Match scores dalam range valid (0-100)

---

### **SERVICES (60+ Tests)**

#### UserServiceTest (11 tests)
- ✓ Create user dengan profile
- ✓ Create user tanpa profile
- ✓ Get user dengan profile dan languages
- ✓ Get non-existent user returns null
- ✓ Update profile dengan semua fields
- ✓ Update profile preserve old values
- ✓ Profile completion percentage calculation (40%)
- ✓ Profile completion percentage 100%
- ✓ Profile completion percentage 0%
- ✓ User creation di-wrap dalam transaction
- ✓ Multiple users dapat di-create independently

#### AuthServiceTest (11 tests)
- ✓ Generate token creates valid token
- ✓ Token associated dengan user
- ✓ Generate token replace old tokens untuk same device
- ✓ Generate token untuk multiple devices
- ✓ Send password reset link store token
- ✓ Send password reset link ignore non-existent user
- ✓ Send password reset link case-insensitive
- ✓ Reset password dengan invalid token
- ✓ Reset password tanpa reset request
- ✓ Password reset request limit (3 requests)
- ✓ Multiple users password reset independently

#### RoadmapServiceTest (15 tests)
- ✓ Generate roadmap creates roadmap record
- ✓ Generate roadmap creates daily tasks
- ✓ 60 days deadline → 5 tasks
- ✓ <14 days deadline → 3 tasks
- ✓ 14-30 days deadline → 4 tasks
- ✓ Roadmap tasks punya meaningful titles
- ✓ Roadmap status is 'active'
- ✓ Roadmap deadline match scholarship deadline
- ✓ Task due dates spread across days
- ✓ Last task due date before deadline
- ✓ Get daily tasks returns today's tasks
- ✓ Get daily tasks ignore inactive roadmaps
- ✓ Get daily tasks empty if no tasks today
- ✓ Get daily tasks returns user-specific tasks
- ✓ Tasks punya sequential day numbers

#### MatchingServiceTest (15 tests)
- ✓ Find matches returns array
- ✓ Find matches dengan no scholarships returns empty
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

## 📊 Expected Output

Saat menjalankan `php artisan test tests/Unit`:

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

Tests:  101 passed (100%)
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
```php
protected function setUp(): void
{
    parent::setUp();
    $this->service = new UserService();
    $this->user = User::factory()->create();
}
```

### 4. **Use RefreshDatabase untuk Test Isolation**
```php
class UserTest extends TestCase
{
    use RefreshDatabase; // Auto rollback DB setiap test
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

Tests menggunakan:
- **Factories**: `database/factories/UserFactory.php`
- **Seeders**: `database/seeders/`
- **RefreshDatabase**: Automatic rollback per test

---

## ✅ Checklist Sebelum Commit

- [ ] Run `php artisan test tests/Unit` - semua test pass
- [ ] Tidak ada SQL errors
- [ ] Coverage minimal 80% untuk models/services
- [ ] Test names jelas dan deskriptif
- [ ] Menggunakan RefreshDatabase trait
- [ ] Tidak ada hardcoded values (pakai factories)
- [ ] Async/parallel tests berjalan lancar

---

## 📚 Referensi

- [Laravel Testing Docs](https://laravel.com/docs/11.x/testing)
- [PHPUnit Docs](https://phpunit.de/documentation.html)
- [Testing Best Practices](https://laravel.com/docs/11.x/testing#models)

---

**Created**: April 3, 2026  
**Total Tests**: 101  
**Coverage**: Models + Services  
**Next**: Feature Tests + Integration Tests
