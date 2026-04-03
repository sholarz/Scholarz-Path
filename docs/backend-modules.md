# BACKEND MODULE DESIGN
**Scholarship Aggregator & Preparation Platform**

This document outlines the modular architecture of the Laravel backend system, detailing each service module, its responsibilities, and interactions.

---

## SYSTEM ARCHITECTURE OVERVIEW

The backend follows a **Clean Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│              API Layer                   │
│        (Controllers & Routes)           │
├─────────────────────────────────────────┤
│            Service Layer                │
│     (Business Logic & Orchestration)    │
├─────────────────────────────────────────┤
│          Repository Layer               │
│        (Data Access & Queries)          │
├─────────────────────────────────────────┤
│            Model Layer                  │
│     (Eloquent Models & Relations)       │
└─────────────────────────────────────────┘
```

---

## MODULE BREAKDOWN

### 1. **AUTHENTICATION MODULE**
**Location:** `app/Modules/Auth/`

**Responsibilities:**
- User registration and login
- JWT token management
- Password reset functionality
- Email verification
- Rate limiting for auth endpoints

**Services:**
- `AuthService` - Core authentication logic
- `JWTService` - Token generation and validation
- `EmailVerificationService` - Email verification workflow
- `PasswordResetService` - Password reset workflow

**Key Classes:**
```php
AuthController
AuthService
JWTService
EmailVerificationService
PasswordResetService
LoginRequest
RegisterRequest
```

---

### 2. **USER MANAGEMENT MODULE**
**Location:** `app/Modules/User/`

**Responsibilities:**
- User profile management
- Language proficiency tracking
- Account settings
- User statistics and analytics

**Services:**
- `UserService` - User profile operations
- `ProfileService` - Profile completion and validation
- `LanguageService` - Language proficiency management

**Key Classes:**
```php
UserController
ProfileController
UserService
ProfileService
LanguageService
User (Model)
UserProfile (Model)
UserLanguage (Model)
```

---

### 3. **SCHOLARSHIP SERVICE MODULE**
**Location:** `app/Modules/Scholarship/`

**Responsibilities:**
- Scholarship CRUD operations
- Provider management
- Search and filtering
- Data validation and cleaning
- View tracking and analytics

**Services:**
- `ScholarshipService` - Core scholarship operations
- `ProviderService` - Provider management
- `SearchService` - Advanced search and filtering
- `ValidationService` - Data validation for scraped content

**Key Classes:**
```php
ScholarshipController
ProviderController
ScholarshipService
ProviderService
SearchService
Scholarship (Model)
ScholarshipProvider (Model)
ScholarshipRepository
```

---

### 4. **MATCHING ENGINE MODULE**
**Location:** `app/Modules/Matching/`

**Responsibilities:**
- Profile-to-scholarship matching algorithm
- Match scoring and ranking
- Rate limiting for free users
- Match history tracking
- AI-powered recommendations

**Services:**
- `MatchingService` - Core matching algorithm
- `ScoringService` - Match score calculation
- `RateLimitService` - Free user limitations
- `RecommendationService` - AI recommendations

**Key Classes:**
```php
MatchingController
MatchingService
ScoringService
RateLimitService
RecommendationService
ScholarshipMatch (Model)
MatchSearch (Model)
MatchingEngine
```

**Algorithm Components:**
```php
interface MatchingCriteria {
    public function evaluate(UserProfile $profile, Scholarship $scholarship): float;
}

class GPAMatcher implements MatchingCriteria
class FieldOfStudyMatcher implements MatchingCriteria
class LocationMatcher implements MatchingCriteria
class LanguageMatcher implements MatchingCriteria
class DegreeLevelMatcher implements MatchingCriteria
```

---

### 5. **ROADMAP GENERATOR MODULE**
**Location:** `app/Modules/Roadmap/`

**Responsibilities:**
- AI-powered roadmap generation
- Milestone and task creation
- Progress tracking
- Deadline management
- Document checklist management

**Services:**
- `RoadmapService` - Roadmap CRUD operations
- `GeneratorService` - AI roadmap generation
- `ProgressService` - Progress tracking and analytics
- `TaskService` - Daily task management
- `DocumentService` - Document checklist management

**Key Classes:**
```php
RoadmapController
TaskController
DocumentController
RoadmapService
GeneratorService
ProgressService
TaskService
DocumentService
Roadmap (Model)
RoadmapMilestone (Model)
DailyTask (Model)
DocumentChecklist (Model)
```

**AI Components:**
```php
class RoadmapGenerator {
    public function generateForScholarship(Scholarship $scholarship, User $user): array;
    public function createMilestones(array $requirements): array;
    public function generateDailyTasks(RoadmapMilestone $milestone): array;
}
```

---

### 6. **FORUM MODULE**
**Location:** `app/Modules/Forum/`

**Responsibilities:**
- Forum category management
- Topic and reply CRUD
- User interactions (likes, solutions)
- Moderation tools
- Search within forum

**Services:**
- `ForumService` - Core forum operations
- `CategoryService` - Category management
- `TopicService` - Topic operations
- `ReplyService` - Reply management
- `ModerationService` - Admin moderation tools

**Key Classes:**
```php
ForumController
CategoryController
TopicController
ReplyController
ForumService
CategoryService
TopicService
ReplyService
ModerationService
ForumCategory (Model)
ForumTopic (Model)
ForumReply (Model)
ForumReplyLike (Model)
```

---

### 7. **SUBSCRIPTION MODULE**
**Location:** `app/Modules/Subscription/`

**Responsibilities:**
- Subscription plan management
- Payment processing integration
- Usage tracking and limits
- Billing and invoicing
- Upgrade/downgrade workflows

**Services:**
- `SubscriptionService` - Core subscription logic
- `PlanService` - Plan management
- `PaymentService` - Payment processing (Stripe integration)
- `UsageService` - Feature usage tracking
- `BillingService` - Billing and invoicing

**Key Classes:**
```php
SubscriptionController
PlanController
PaymentController
SubscriptionService
PlanService
PaymentService
UsageService
BillingService
SubscriptionPlan (Model)
UserSubscription (Model)
```

**Payment Integration:**
```php
interface PaymentGateway {
    public function createSubscription(User $user, Plan $plan): PaymentResult;
    public function cancelSubscription(string $subscriptionId): bool;
    public function updatePaymentMethod(string $subscriptionId, string $paymentMethod): bool;
}

class StripeGateway implements PaymentGateway
class PayPalGateway implements PaymentGateway
```

---

### 8. **NOTIFICATION MODULE**
**Location:** `app/Modules/Notification/`

**Responsibilities:**
- In-app notifications
- Email notifications
- Push notifications (future)
- Notification preferences
- Delivery tracking

**Services:**
- `NotificationService` - Core notification logic
- `EmailService` - Email notification handling
- `PreferenceService` - User notification preferences

**Key Classes:**
```php
NotificationController
NotificationService
EmailService
PreferenceService
Notification (Model)
NotificationPreference (Model)
```

**Notification Types:**
```php
abstract class BaseNotification {
    abstract public function toMail(User $user): MailMessage;
    abstract public function toDatabase(User $user): array;
}

class DeadlineReminderNotification extends BaseNotification
class NewMatchNotification extends BaseNotification
class TaskReminderNotification extends BaseNotification
class ForumReplyNotification extends BaseNotification
```

---

### 9. **ADMIN MODULE**
**Location:** `app/Modules/Admin/`

**Responsibilities:**
- System analytics and reporting
- User management
- Content moderation
- System configuration
- Data export and import

**Services:**
- `AdminDashboardService` - Dashboard analytics
- `UserManagementService` - Admin user operations
- `ContentModerationService` - Content moderation
- `SystemConfigService` - System configuration
- `ReportingService` - Analytics and reporting

**Key Classes:**
```php
AdminDashboardController
UserManagementController
ContentModerationController
SystemConfigController
AdminDashboardService
UserManagementService
ContentModerationService
SystemConfigService
ReportingService
```

---

### 10. **DATA INGESTION & QUALITY MODULE**
**Location:** `app/Modules/Ingestion/`

**Responsibilities:**
- Manage curated and mock-assisted scholarship datasets
- Handle admin-assisted ingestion workflows
- Data validation and cleaning
- Duplicate detection
- Scholarship data normalization
- Controlled review logs and monitoring
- Define future external connector interfaces

**Services:**
- `IngestionService` - Dataset handling and data processing
- `ValidationService` - Data validation and cleaning
- `DeduplicationService` - Duplicate scholarship detection
- `NormalizationService` - Data format standardization
- `ConnectorInterfaceService` - Future external source integration contracts

**Key Classes:**
```php
IngestionWebhookController
IngestionService
ValidationService
DeduplicationService
NormalizationService
IngestionLog (Model)
```

---

### 11. **ANALYTICS MODULE**
**Location:** `app/Modules/Analytics/`

**Responsibilities:**
- User behavior tracking
- System performance metrics
- Business intelligence
- Custom event tracking
- A/B testing support

**Services:**
- `AnalyticsService` - Core analytics logic
- `EventTrackingService` - Custom event tracking
- `MetricsService` - System metrics collection
- `ReportingService` - Analytics reporting

**Key Classes:**
```php
AnalyticsController
AnalyticsService
EventTrackingService
MetricsService
ActivityLog (Model)
AnalyticsEvent (Model)
```

---

## SHARED SERVICES & UTILITIES

### 1. **CORE SERVICES**
**Location:** `app/Services/Core/`

```php
CacheService          // Redis/Cache management
FileUploadService     // File upload and storage
ImageProcessingService // Image optimization
EmailTemplateService  // Email template management
APIResponseService    // Standardized API responses
ValidationService     // Custom validation rules
```

### 2. **EXTERNAL INTEGRATIONS**
**Location:** `app/Services/External/`

```php
StripeService        // Payment processing
SendGridService      // Email delivery
CloudinaryService    // Image hosting
GoogleMapsService    // Location services
OpenAIService        // AI content generation
```

### 3. **UTILITIES**
**Location:** `app/Utils/`

```php
DateHelper          // Date manipulation utilities
StringHelper        // String processing utilities
ArrayHelper         // Array manipulation utilities
CurrencyConverter   // Currency conversion
CountryHelper       // Country/locale utilities
```

---

## MIDDLEWARE STACK

### **Authentication Middleware**
```php
app/Http/Middleware/JWTAuth.php           // JWT token validation
app/Http/Middleware/RoleMiddleware.php    // Role-based access control
app/Http/Middleware/SubscriptionCheck.php // Premium feature checks
```

### **Rate Limiting Middleware**
```php
app/Http/Middleware/RateLimit.php         // API rate limiting
app/Http/Middleware/MatchingRateLimit.php // Matching-specific limits
app/Http/Middleware/GuestRateLimit.php    // Guest user limits
```

### **Validation Middleware**
```php
app/Http/Middleware/ValidateJSON.php      // JSON format validation
app/Http/Middleware/SanitizeInput.php     // Input sanitization
app/Http/Middleware/CORS.php              // Cross-origin requests
```

---

## JOB QUEUES & BACKGROUND PROCESSING

### **Queue Jobs**
**Location:** `app/Jobs/`

```php
// Email Jobs
SendWelcomeEmailJob
SendDeadlineReminderJob
SendMatchNotificationJob
SendWeeklyDigestJob

// Processing Jobs
ProcessScrapedDataJob
GenerateRoadmapJob
CalculateMatchScoresJob
UpdateUserStatisticsJob

// Cleanup Jobs
CleanupExpiredTokensJob
ArchiveOldNotificationsJob
UpdateScholarshipStatusJob

// Analytics Jobs
ProcessAnalyticsEventJob
GenerateReportsJob
UpdateDashboardMetricsJob
```

### **Scheduled Tasks**
**Location:** `app/Console/Commands/`

```php
// Daily Commands
SendDailyTaskReminders
UpdateScholarshipDeadlines
CleanupExpiredSessions
ProcessAnalyticsBatch

// Weekly Commands
SendWeeklyDigest
GenerateWeeklyReports
UpdateUserEngagementScores

// Monthly Commands
ProcessMonthlySubscriptions
GenerateMonthlyAnalytics
ArchiveOldData
```

---

## EVENT SYSTEM

### **Domain Events**
**Location:** `app/Events/`

```php
// User Events
UserRegistered
UserSubscriptionChanged
ProfileCompleted

// Scholarship Events
ScholarshipCreated
ScholarshipUpdated
ScholarshipViewed
ScholarshipBookmarked

// Matching Events
MatchingPerformed
NewMatchFound
MatchingQuotaExceeded

// Roadmap Events
RoadmapCreated
MilestoneCompleted
TaskCompleted
DeadlineApproaching

// Forum Events
TopicCreated
ReplyPosted
ReplyLiked
```

### **Event Listeners**
**Location:** `app/Listeners/`

```php
// User Listeners
SendWelcomeEmail
CreateDefaultPreferences
LogUserActivity

// Matching Listeners
SendMatchNotification
UpdateMatchHistory
LogMatchingActivity

// Roadmap Listeners
ScheduleTaskReminders
UpdateProgressStats
LogRoadmapActivity
```

---

## DATA ACCESS PATTERNS

### **Repository Pattern**
```php
interface RepositoryInterface {
    public function find($id);
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function paginate($perPage = 15);
}

// Implementations
ScholarshipRepository
UserRepository
RoadmapRepository
ForumRepository
```

### **Query Builders**
```php
class ScholarshipQueryBuilder {
    public function byLevel(string $level): self;
    public function byCountry(string $country): self;
    public function byDeadline(Carbon $from, Carbon $to): self;
    public function byAmount(float $min, float $max): self;
    public function active(): self;
    public function featured(): self;
}
```

---

## CACHING STRATEGY

### **Cache Layers**
```php
// Model Caching
ScholarshipCache     // Popular scholarships
UserCache           // User profiles and preferences
MatchingCache       // Matching results

// Query Caching
SearchResultsCache  // Search query results
StatisticsCache     // Dashboard statistics
ForumCache         // Forum topics and replies

// API Response Caching
PublicAPICache     // Public endpoint responses
AuthenticatedCache // User-specific responses
```

### **Cache Keys Convention**
```php
user:{user_id}:profile
user:{user_id}:matches
scholarship:{id}:details
search:{hash}:results
forum:category:{slug}:topics
statistics:dashboard:monthly
```

---

## ERROR HANDLING & LOGGING

### **Exception Handlers**
```php
app/Exceptions/BusinessException.php      // Business logic errors
app/Exceptions/ValidationException.php    // Validation errors
app/Exceptions/AuthorizationException.php // Permission errors
app/Exceptions/RateLimitException.php     // Rate limiting errors
app/Exceptions/SubscriptionException.php  // Subscription errors
```

### **Logging Channels**
```php
// config/logging.php
'channels' => [
    'api' => [/* API request/response logs */],
    'matching' => [/* Matching algorithm logs */],
    'scraper' => [/* Scraper integration logs */],
    'payments' => [/* Payment processing logs */],
    'security' => [/* Security-related logs */],
]
```

---

## TESTING ARCHITECTURE

### **Test Structure**
```php
tests/
├── Feature/           # Integration tests
│   ├── Auth/
│   ├── Scholarship/
│   ├── Matching/
│   └── Roadmap/
├── Unit/              # Unit tests
│   ├── Services/
│   ├── Models/
│   └── Helpers/
└── Performance/       # Performance tests
    ├── Matching/
    └── Search/
```

### **Test Utilities**
```php
tests/TestCase.php           # Base test class
tests/Factories/            # Model factories
tests/Fixtures/             # Test data fixtures
tests/Helpers/TestHelper.php # Test utility functions
```

This modular architecture ensures clean separation of concerns, testability, and scalability for the scholarship platform MVP.