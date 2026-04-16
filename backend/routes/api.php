<?php

use App\Modules\Auth\Controllers\AuthController;
use App\Modules\User\Controllers\UserController;
use App\Modules\User\Controllers\ProfileController;
use App\Modules\Scholarship\Controllers\ScholarshipController;
use App\Modules\Matching\Controllers\MatchingController;
use App\Modules\Roadmap\Controllers\RoadmapController;
use App\Modules\Forum\Controllers\ForumController;
use App\Modules\Subscription\Controllers\SubscriptionController;
use App\Modules\Test\Controllers\TestController;
use App\Modules\Admin\Controllers\AdminDashboardController;
use App\Modules\Scraper\Controllers\ScraperWebhookController;
use App\Modules\Profile\Controllers\PreferenceController;
use App\Modules\Profile\Controllers\LanguageTestController;
use App\Modules\Profile\Controllers\DocumentController;
use App\Modules\Profile\Controllers\LookupController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// =====================================================
// PUBLIC ROUTES (No Authentication Required)
// =====================================================

// Lookup endpoints (public — untuk dropdown di frontend)
Route::prefix('lookups')->group(function () {
    Route::get('/countries', [LookupController::class, 'countries']);
    Route::get('/fields-of-study', [LookupController::class, 'fieldsOfStudy']);
    Route::get('/budget-preferences', [LookupController::class, 'budgetPreferences']);
    Route::get('/start-years', [LookupController::class, 'startYears']);
    Route::get('/language-test-types', [LookupController::class, 'languageTestTypes']);
});

// Authentication - Rate limited (anti brute-force)
Route::middleware('throttle:5,1')->prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);
});

// Public Scholarships - Rate limited (normal API limits)
Route::middleware('throttle:60,1')->prefix('scholarships')->group(function () {
    Route::get('/', [ScholarshipController::class, 'index']);
    Route::get('/providers/{id}', [ScholarshipController::class, 'getByProvider']);
    Route::get('/{id}', [ScholarshipController::class, 'show'])->whereUuid('id');
});

// Subscription Plans (Public)
Route::get('/subscriptions/plans', [SubscriptionController::class, 'getPlans']);

// System Health
Route::get('/health', function () {
    return response()->json(['status' => 'OK', 'timestamp' => now()]);
});

// Public Test Simulations
Route::prefix('tests')->group(function () {
    Route::get('/', [TestController::class, 'index']);
    Route::get('/{id}', [TestController::class, 'show']);
});

// =====================================================
// AUTHENTICATED ROUTES
// =====================================================

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Authentication (Authenticated)
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
    
    // User Management
    Route::prefix('user')->group(function () {
        Route::get('/', [UserController::class, 'getCurrentUser']);
        // Backend B demo alias endpoint
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/email', [UserController::class, 'updateEmail']);
        Route::put('/password', [UserController::class, 'updatePassword']);
        Route::delete('/', [UserController::class, 'deleteAccount']);
    });
    
    // User Profile
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::get('/me', [ProfileController::class, 'me']);
        Route::get('/me/basic', [ProfileController::class, 'basic']);
        Route::put('/me/basic', [ProfileController::class, 'updateBasic']);
        Route::get('/me/academic', [ProfileController::class, 'academic']);
        Route::put('/me/academic', [ProfileController::class, 'updateAcademic']);
        Route::get('/me/status', [ProfileController::class, 'status']);
        Route::post('/languages', [ProfileController::class, 'addLanguage']);
        Route::put('/languages/{id}', [ProfileController::class, 'updateLanguage']);
        Route::delete('/languages/{id}', [ProfileController::class, 'deleteLanguage']);
        Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
    });

    // Preferences (negara tujuan & bidang studi)
    Route::prefix('preferences')->group(function () {
        Route::get('/', [PreferenceController::class, 'index']);
        Route::put('/', [PreferenceController::class, 'update']);
    });

    // Language Tests (skor IELTS/TOEFL user)
    Route::prefix('language-tests')->group(function () {
        Route::get('/', [LanguageTestController::class, 'index']);
        Route::post('/', [LanguageTestController::class, 'store']);
        Route::put('/{id}', [LanguageTestController::class, 'update']);
        Route::delete('/{id}', [LanguageTestController::class, 'destroy']);
    });

    // Document Readiness
    Route::prefix('documents')->group(function () {
        Route::get('/readiness', [DocumentController::class, 'readiness']);
        Route::put('/readiness', [DocumentController::class, 'updateReadiness']);
    });
    
    // Scholarship Matching
    Route::prefix('scholarships')->group(function () {
        Route::post('/match', [MatchingController::class, 'performMatching']);
        Route::get('/matches/history', [MatchingController::class, 'getMatchHistory']);
        Route::get('/bookmarks', [ScholarshipController::class, 'getBookmarks']);
        Route::post('/{id}/bookmark', [ScholarshipController::class, 'bookmark'])->whereUuid('id');
        Route::delete('/{id}/bookmark', [ScholarshipController::class, 'removeBookmark'])->whereUuid('id');
    });
    
    // Roadmap Management
    Route::prefix('roadmaps')->group(function () {
        Route::get('/', [RoadmapController::class, 'index']);
        Route::post('/', [RoadmapController::class, 'create']);
        Route::get('/{id}', [RoadmapController::class, 'show']);
        Route::put('/{id}', [RoadmapController::class, 'update']);
        Route::delete('/{id}', [RoadmapController::class, 'destroy']);
        Route::put('/{id}/progress', [RoadmapController::class, 'updateProgress']);
    });
    
    // Daily Tasks
    Route::prefix('tasks')->group(function () {
        Route::get('/daily', [RoadmapController::class, 'getDailyTasks']);
        Route::put('/{id}/complete', [RoadmapController::class, 'completeTask']);
        Route::put('/{id}/skip', [RoadmapController::class, 'skipTask']);
    });

    // Test submissions
    Route::prefix('tests')->group(function () {
        Route::post('/{id}/submit', [TestController::class, 'submit']);
    });
    
    // Forum
    Route::prefix('forum')->group(function () {
        Route::get('/posts', [ForumController::class, 'getPosts']);
        Route::post('/posts', [ForumController::class, 'createPost']);
        Route::get('/posts/pending', [ForumController::class, 'getPendingPosts'])->middleware('role:admin');
        Route::get('/posts/{id}', [ForumController::class, 'getPost'])->whereUuid('id');
        Route::put('/posts/{id}', [ForumController::class, 'updatePost'])->whereUuid('id');
        Route::delete('/posts/{id}', [ForumController::class, 'deletePost'])->whereUuid('id');
        Route::post('/posts/{id}/like', [ForumController::class, 'likePost'])->whereUuid('id');
        Route::post('/posts/{id}/save', [ForumController::class, 'savePost'])->whereUuid('id');
        Route::post('/posts/{id}/comments', [ForumController::class, 'addComment'])->whereUuid('id');
        Route::post('/posts/{id}/report', [ForumController::class, 'reportPost'])->whereUuid('id');
        Route::put('/posts/{id}/approve', [ForumController::class, 'approvePost'])->whereUuid('id')->middleware('role:admin');
        Route::put('/posts/{id}/reject', [ForumController::class, 'rejectPost'])->whereUuid('id')->middleware('role:admin');
        Route::get('/reports', [ForumController::class, 'getReports'])->middleware('role:admin');
        Route::put('/reports/{id}/review', [ForumController::class, 'reviewReport'])->whereUuid('id')->middleware('role:admin');
        Route::post('/comments/{id}/like', [ForumController::class, 'toggleCommentLike'])->whereUuid('id');
        Route::post('/comments/{id}/replies', [ForumController::class, 'addReply'])->whereUuid('id');

        Route::get('/categories', [ForumController::class, 'getCategories']);
        Route::get('/categories/{slug}/topics', [ForumController::class, 'getTopicsByCategory']);
        Route::post('/categories/{slug}/topics', [ForumController::class, 'createTopic']);
        Route::get('/topics/{id}', [ForumController::class, 'getTopic']);
        Route::post('/topics/{id}/replies', [ForumController::class, 'createReply']);
        Route::put('/replies/{id}/like', [ForumController::class, 'likeReply']);
        Route::put('/replies/{id}/solution', [ForumController::class, 'markAsSolution']);
        Route::get('/my-topics', [ForumController::class, 'getUserTopics']);
        Route::get('/my-replies', [ForumController::class, 'getUserReplies']);
    });
    
    // Subscriptions
    Route::prefix('subscriptions')->group(function () {
        Route::get('/current', [SubscriptionController::class, 'getCurrentSubscription']);
        Route::post('/subscribe', [SubscriptionController::class, 'subscribe']);
        Route::post('/cancel', [SubscriptionController::class, 'cancel']);
        Route::post('/resume', [SubscriptionController::class, 'resume']);
        Route::put('/payment-method', [SubscriptionController::class, 'updatePaymentMethod']);
        Route::get('/usage', [SubscriptionController::class, 'getUsageStats']);
        Route::get('/invoices', [SubscriptionController::class, 'getInvoices']);
    });
    
    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [UserController::class, 'getNotifications']);
        Route::put('/{id}/read', [UserController::class, 'markAsRead']);
        Route::put('/mark-all-read', [UserController::class, 'markAllAsRead']);
        Route::delete('/{id}', [UserController::class, 'deleteNotification']);
    });
});

// =====================================================
// ADMIN ROUTES
// =====================================================

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'getDashboardStats'])
        ->middleware('permission:admin_dashboard');
    
    // User Management
    Route::prefix('users')->middleware('permission:manage_users')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'getUsers']);
        Route::get('/{id}', [AdminDashboardController::class, 'getUserDetails']);
        Route::put('/{id}/role', [AdminDashboardController::class, 'updateUserRole']);
        Route::put('/{id}/status', [AdminDashboardController::class, 'updateUserStatus']);
        Route::get('/{id}/activity', [AdminDashboardController::class, 'getUserActivity']);
    });
    
    // Scholarship Management
    Route::prefix('scholarships')->middleware('permission:manage_scholarships')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'getScholarshipsForAdmin']);
        Route::post('/', [AdminDashboardController::class, 'createScholarship']);
        Route::put('/{id}', [AdminDashboardController::class, 'updateScholarship']);
        Route::delete('/{id}', [AdminDashboardController::class, 'deleteScholarship']);
        Route::put('/{id}/verify', [AdminDashboardController::class, 'verifyScholarship']);
        Route::put('/{id}/feature', [AdminDashboardController::class, 'featureScholarship']);
    });
    
    // Forum Moderation
    Route::prefix('forum')->middleware('permission:moderate_forum')->group(function () {
        Route::get('/flagged-content', [AdminDashboardController::class, 'getFlaggedContent']);
        Route::get('/bans', [AdminDashboardController::class, 'getForumBans']);
        Route::put('/topics/{id}/status', [AdminDashboardController::class, 'updateTopicStatus']);
        Route::delete('/replies/{id}', [AdminDashboardController::class, 'deleteReply']);
        Route::put('/users/{id}/forum-ban', [AdminDashboardController::class, 'banFromForum']);
        Route::put('/users/{id}/forum-unban', [AdminDashboardController::class, 'unbanFromForum']);
    });
    
    // System Reports
    Route::prefix('reports')->middleware('permission:view_analytics')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'getReports']);
        Route::put('/{id}/resolve', [AdminDashboardController::class, 'resolveReport']);
        Route::get('/audit-logs', [AdminDashboardController::class, 'getAuditLogs']);
        Route::get('/analytics', [AdminDashboardController::class, 'getAnalytics']);
        Route::get('/usage-stats', [AdminDashboardController::class, 'getUsageStats']);
        Route::get('/revenue', [AdminDashboardController::class, 'getRevenueStats']);
        Route::get('/scraping-logs', [AdminDashboardController::class, 'getScrapingLogs']);
    });
});

// =====================================================
// WEBHOOK ROUTES (External Integrations)
// =====================================================

Route::prefix('webhooks')->group(function () {
    // Stripe Payment Webhooks
    Route::post('/stripe', [SubscriptionController::class, 'stripeWebhook']);
    
    // Scraper Integration Webhooks
    Route::post('/scraper', [ScraperWebhookController::class, 'handleScrapedData']);
    
    // Email Service Webhooks
    Route::post('/sendgrid', [UserController::class, 'sendgridWebhook']);
});
