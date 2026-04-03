# SCHOLARSHIP AGGREGATOR API DOCUMENTATION
**Version:** 1.0  
**Base URL:** `https://api.scholarz-path.com/api/v1`  
**Authentication:** Bearer Token (JWT)

---

## TABLE OF CONTENTS
1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Profile Management](#profile-management)
4. [Scholarship Management](#scholarship-management)
5. [Matching Engine](#matching-engine)
6. [Roadmap Management](#roadmap-management)
7. [Forum Management](#forum-management)
8. [Subscription Management](#subscription-management)
9. [Admin Management](#admin-management)
10. [Error Handling](#error-handling)

---

## AUTHENTICATION

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123",
    "remember": true
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "role": "free",
            "profile": {
                "first_name": "John",
                "last_name": "Doe",
                "profile_completion_percentage": 75
            }
        },
        "token": "jwt_token_here",
        "expires_at": "2026-03-10T12:00:00Z"
    },
    "message": "Login successful"
}
```

### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "terms_accepted": true
}
```

**Response (201):**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "email": "user@example.com",
            "role": "free"
        },
        "token": "jwt_token_here"
    },
    "message": "Registration successful"
}
```

### Logout
```http
POST /auth/logout
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### Refresh Token
```http
POST /auth/refresh
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "token": "new_jwt_token_here",
        "expires_at": "2026-03-10T12:00:00Z"
    }
}
```

---

## USER MANAGEMENT

### Get Current User
```http
GET /user
```
**Headers:** `Authorization: Bearer {token}`  
**Access:** All authenticated users

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "email": "user@example.com",
        "role": "premium",
        "status": "active",
        "profile": {
            "first_name": "John",
            "last_name": "Doe",
            "gpa": 3.75,
            "major": "Computer Science",
            "degree_level": "bachelor",
            "profile_completion_percentage": 85
        },
        "subscription": {
            "plan": "Premium Monthly",
            "status": "active",
            "expires_at": "2026-04-10T12:00:00Z"
        }
    }
}
```

### Update User Email
```http
PUT /user/email
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "email": "newemail@example.com",
    "current_password": "password123"
}
```

### Update User Password
```http
PUT /user/password
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "current_password": "oldpassword",
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

---

## PROFILE MANAGEMENT

### Update Profile
```http
PUT /profile
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "date_of_birth": "1995-06-15",
    "nationality": "US",
    "current_country": "US",
    "gpa": 3.75,
    "major": "Computer Science",
    "degree_level": "bachelor",
    "graduation_year": 2024
}
```

**Response (200):**
```json
{
    "success": true,
    "data": {
        "profile_completion_percentage": 90,
        "updated_fields": ["gpa", "major"]
    },
    "message": "Profile updated successfully"
}
```

### Add/Update Language Proficiency
```http
POST /profile/languages
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "language": "English",
    "proficiency_level": "advanced",
    "certification": "TOEFL",
    "score": "110"
}
```

### Delete Language
```http
DELETE /profile/languages/{language_id}
```

---

## SCHOLARSHIP MANAGEMENT

### Get Scholarships (Public)
```http
GET /scholarships
```
**Access:** Public (with rate limiting for guests)

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (max: 50, default: 20)
- `search` (string): Search in title and description
- `level` (string): Degree level filter
- `type` (string): Scholarship type filter
- `country` (string): Target country filter
- `deadline_from` (date): Filter by deadline start date
- `deadline_to` (date): Filter by deadline end date
- `amount_min` (number): Minimum scholarship amount
- `amount_max` (number): Maximum scholarship amount
- `sort` (string): Sort by (deadline, amount, created_at)
- `order` (string): Sort order (asc, desc)

**Response (200):**
```json
{
    "success": true,
    "data": {
        "scholarships": [
            {
                "id": "uuid",
                "title": "Excellence Scholarship 2026",
                "provider": {
                    "name": "Global Education Foundation",
                    "logo_url": "https://example.com/logo.png"
                },
                "amount": 50000.00,
                "currency": "USD",
                "type": "merit",
                "level": "bachelor",
                "target_countries": ["US", "CA", "UK"],
                "application_deadline": "2026-05-15",
                "description": "Full scholarship for outstanding students...",
                "is_featured": true,
                "view_count": 1250
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 450,
            "total_pages": 23,
            "next_page_url": "/scholarships?page=2",
            "prev_page_url": null
        }
    }
}
```

### Get Scholarship Details
```http
GET /scholarships/{id}
```
**Access:** Public

**Response (200):**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "title": "Excellence Scholarship 2026",
        "description": "Detailed description...",
        "provider": {
            "name": "Global Education Foundation",
            "website": "https://gef.org",
            "description": "Leading education foundation..."
        },
        "amount": 50000.00,
        "currency": "USD",
        "type": "merit",
        "level": "bachelor",
        "target_countries": ["US", "CA", "UK"],
        "eligible_nationalities": ["*"], // * means all
        "fields_of_study": ["Computer Science", "Engineering", "Mathematics"],
        "minimum_gpa": 3.5,
        "language_requirements": {
            "English": "advanced"
        },
        "application_deadline": "2026-05-15",
        "start_date": "2026-09-01",
        "duration_months": 48,
        "application_url": "https://gef.org/apply",
        "requirements": "Detailed requirements...",
        "benefits": "Full tuition, accommodation...",
        "selection_criteria": "Academic excellence...",
        "application_process": "Step by step process...",
        "related_scholarships": [
            // Array of similar scholarships
        ]
    }
}
```

---

## MATCHING ENGINE

### Run Scholarship Matching
```http
POST /scholarships/match
```
**Headers:** `Authorization: Bearer {token}`  
**Access:** Free users (limited), Premium users (unlimited)

**Request Body (Optional - uses profile by default):**
```json
{
    "gpa": 3.75,
    "major": "Computer Science",
    "degree_level": "bachelor",
    "target_countries": ["US", "CA"],
    "languages": [
        {
            "language": "English",
            "proficiency_level": "advanced"
        }
    ]
}
```

**Response (200) - Free User:**
```json
{
    "success": true,
    "data": {
        "matches": [
            {
                "scholarship": {
                    "id": "uuid",
                    "title": "Tech Excellence Scholarship",
                    "amount": 45000.00,
                    "application_deadline": "2026-06-01"
                },
                "match_score": 95.5,
                "criteria_met": [
                    "GPA requirement (3.5+)",
                    "Field of study match",
                    "Language requirement"
                ],
                "criteria_missing": [],
                "recommendations": "Perfect match! Apply immediately as deadline is approaching."
            },
            {
                "scholarship": {
                    "id": "uuid2",
                    "title": "STEM Future Leaders",
                    "amount": 30000.00,
                    "application_deadline": "2026-07-15"
                },
                "match_score": 87.2,
                "criteria_met": [
                    "GPA requirement (3.0+)",
                    "Field of study match"
                ],
                "criteria_missing": [
                    "Research experience preferred"
                ],
                "recommendations": "Strong match. Consider highlighting any research projects in your application."
            },
            {
                "scholarship": {
                    "id": "uuid3",
                    "title": "Innovation Scholarship",
                    "amount": 25000.00,
                    "application_deadline": "2026-08-01"
                },
                "match_score": 82.0,
                "criteria_met": [
                    "Academic performance",
                    "Field alignment"
                ],
                "criteria_missing": [
                    "Leadership experience",
                    "Community service"
                ],
                "recommendations": "Good match. Focus on demonstrating leadership and community involvement."
            }
        ],
        "total_found": 45,
        "showing": 3,
        "upgrade_message": "Upgrade to Premium to see all 45 matching scholarships!",
        "search_metadata": {
            "criteria_used": {
                "gpa": 3.75,
                "major": "Computer Science",
                "degree_level": "bachelor"
            },
            "matched_at": "2026-03-10T10:30:00Z"
        }
    }
}
```

### Get Match History
```http
GET /scholarships/matches/history
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "searches": [
            {
                "id": "uuid",
                "search_criteria": {
                    "gpa": 3.75,
                    "major": "Computer Science"
                },
                "results_count": 45,
                "created_at": "2026-03-10T10:30:00Z"
            }
        ],
        "rate_limit": {
            "remaining_searches_this_period": 2,
            "resets_at": "2026-03-13T00:00:00Z"
        }
    }
}
```

### Bookmark Scholarship
```http
POST /scholarships/{id}/bookmark
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "is_bookmarked": true
    }
}
```

### Get Bookmarked Scholarships
```http
GET /scholarships/bookmarks
```
**Headers:** `Authorization: Bearer {token}`

---

## ROADMAP MANAGEMENT

### Create Roadmap
```http
POST /roadmaps
```
**Headers:** `Authorization: Bearer {token}`  
**Access:** Free users (limited), Premium users (unlimited)

**Request Body:**
```json
{
    "scholarship_id": "uuid",
    "title": "MIT Computer Science Application Roadmap",
    "target_deadline": "2026-05-15"
}
```

**Response (201):**
```json
{
    "success": true,
    "data": {
        "roadmap": {
            "id": "uuid",
            "title": "MIT Computer Science Application Roadmap",
            "target_deadline": "2026-05-15",
            "estimated_hours": 120,
            "status": "active",
            "progress_percentage": 0
        },
        "milestones": [
            {
                "id": "uuid",
                "title": "Academic Documents",
                "target_date": "2026-04-01",
                "priority": "high",
                "order_index": 1
            },
            {
                "id": "uuid2",
                "title": "Personal Statement",
                "target_date": "2026-04-15",
                "priority": "critical",
                "order_index": 2
            }
        ],
        "tasks_generated": 25,
        "documents_required": 8
    },
    "message": "Roadmap created successfully with AI-generated milestones and tasks"
}
```

### Get User Roadmaps
```http
GET /roadmaps
```
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (string): Filter by status
- `scholarship_id` (string): Filter by scholarship

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "title": "MIT CS Application",
            "scholarship": {
                "title": "MIT Excellence Scholarship",
                "application_deadline": "2026-05-15"
            },
            "target_deadline": "2026-05-15",
            "status": "active",
            "progress_percentage": 35,
            "estimated_hours": 120,
            "completed_hours": 42,
            "milestones_total": 6,
            "milestones_completed": 2,
            "tasks_pending": 12,
            "days_remaining": 65
        }
    ]
}
```

### Get Roadmap Details
```http
GET /roadmaps/{id}
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "roadmap": {
            "id": "uuid",
            "title": "MIT CS Application",
            "description": "Complete application roadmap...",
            "target_deadline": "2026-05-15",
            "status": "active",
            "progress_percentage": 35,
            "scholarship": {
                "id": "uuid",
                "title": "MIT Excellence Scholarship",
                "amount": 75000.00,
                "application_deadline": "2026-05-15"
            }
        },
        "milestones": [
            {
                "id": "uuid",
                "title": "Academic Documents",
                "description": "Gather and prepare all academic documents",
                "target_date": "2026-04-01",
                "priority": "high",
                "status": "completed",
                "order_index": 1,
                "tasks_count": 5,
                "tasks_completed": 5
            }
        ],
        "recent_tasks": [
            {
                "id": "uuid",
                "title": "Request transcripts",
                "due_date": "2026-03-12",
                "status": "pending",
                "estimated_duration": 30
            }
        ],
        "documents": [
            {
                "id": "uuid",
                "document_name": "Official Transcript",
                "status": "completed",
                "is_required": true,
                "uploaded_at": "2026-03-08T14:30:00Z"
            }
        ]
    }
}
```

### Update Roadmap Progress
```http
PUT /roadmaps/{id}/progress
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "progress_percentage": 45,
    "notes": "Completed personal statement draft"
}
```

### Get Daily Tasks
```http
GET /tasks/daily
```
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `date` (date): Specific date (default: today)
- `status` (string): Filter by status

**Response (200):**
```json
{
    "success": true,
    "data": {
        "date": "2026-03-10",
        "tasks": [
            {
                "id": "uuid",
                "title": "Review scholarship requirements",
                "description": "Double-check all requirements for MIT scholarship",
                "roadmap": {
                    "title": "MIT CS Application",
                    "scholarship_title": "MIT Excellence Scholarship"
                },
                "estimated_duration": 45,
                "status": "pending",
                "task_type": "research",
                "priority": "high"
            }
        ],
        "summary": {
            "total_tasks": 5,
            "completed": 2,
            "pending": 3,
            "estimated_time_remaining": 120
        }
    }
}
```

### Complete Task
```http
PUT /tasks/{id}/complete
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "notes": "Completed successfully, found 2 additional requirements",
    "actual_duration": 60
}
```

---

## FORUM MANAGEMENT

### Get Forum Categories
```http
GET /forum/categories
```
**Access:** All authenticated users

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "General Discussion",
            "description": "General scholarship discussions",
            "slug": "general",
            "icon": "chat",
            "topics_count": 1250,
            "latest_topic": {
                "title": "Best scholarship databases?",
                "created_at": "2026-03-10T09:30:00Z",
                "author": "John D."
            }
        }
    ]
}
```

### Get Topics by Category
```http
GET /forum/categories/{slug}/topics
```
**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (int): Page number
- `sort` (string): latest_reply, created_at, reply_count
- `status` (string): open, closed, pinned

**Response (200):**
```json
{
    "success": true,
    "data": {
        "topics": [
            {
                "id": "uuid",
                "title": "Tips for scholarship essays?",
                "content_preview": "I'm applying for several scholarships and need help...",
                "author": {
                    "name": "Jane Smith",
                    "role": "premium"
                },
                "status": "open",
                "view_count": 45,
                "reply_count": 12,
                "tags": ["essays", "tips", "application"],
                "created_at": "2026-03-09T14:20:00Z",
                "last_reply_at": "2026-03-10T08:15:00Z",
                "is_featured": false
            }
        ],
        "pagination": {
            // Standard pagination object
        }
    }
}
```

### Create Topic
```http
POST /forum/categories/{slug}/topics
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "title": "Need help with STEM scholarships",
    "content": "I'm a Computer Science student looking for STEM scholarships. Any recommendations?",
    "tags": ["STEM", "computer-science", "recommendations"]
}
```

### Get Topic with Replies
```http
GET /forum/topics/{id}
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "topic": {
            "id": "uuid",
            "title": "Need help with STEM scholarships",
            "content": "Full topic content...",
            "author": {
                "name": "Jane Smith",
                "role": "premium"
            },
            "status": "open",
            "view_count": 45,
            "reply_count": 8,
            "tags": ["STEM", "computer-science"],
            "created_at": "2026-03-09T14:20:00Z"
        },
        "replies": [
            {
                "id": "uuid",
                "content": "I recommend checking out the NSF scholarships...",
                "author": {
                    "name": "Mike Johnson",
                    "role": "free"
                },
                "is_solution": false,
                "like_count": 5,
                "created_at": "2026-03-09T15:30:00Z",
                "nested_replies": []
            }
        ]
    }
}
```

### Reply to Topic
```http
POST /forum/topics/{id}/replies
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "content": "Great suggestion! I would also add...",
    "parent_reply_id": "uuid" // Optional, for nested replies
}
```

---

## SUBSCRIPTION MANAGEMENT

### Get Subscription Plans
```http
GET /subscriptions/plans
```
**Access:** Public

**Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "Free",
            "description": "Basic scholarship matching",
            "price": 0.00,
            "billing_cycle": "monthly",
            "features": [
                "Top 3 scholarship matches",
                "1 roadmap per 3 months",
                "Basic forum access",
                "Scholarship calendar"
            ]
        },
        {
            "id": "uuid2",
            "name": "Premium Monthly",
            "description": "Unlimited access to all features",
            "price": 19.99,
            "billing_cycle": "monthly",
            "features": [
                "Unlimited scholarship matches",
                "Unlimited roadmaps",
                "Priority support",
                "Advanced filters",
                "Export features"
            ]
        }
    ]
}
```

### Subscribe to Plan
```http
POST /subscriptions/subscribe
```
**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
    "plan_id": "uuid",
    "payment_method": "stripe",
    "payment_token": "stripe_token_here",
    "auto_renew": true
}
```

### Get Current Subscription
```http
GET /subscriptions/current
```
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
    "success": true,
    "data": {
        "subscription": {
            "id": "uuid",
            "plan": {
                "name": "Premium Monthly",
                "price": 19.99,
                "billing_cycle": "monthly"
            },
            "status": "active",
            "starts_at": "2026-03-01T00:00:00Z",
            "expires_at": "2026-04-01T00:00:00Z",
            "auto_renew": true,
            "usage": {
                "matches_this_month": 15,
                "roadmaps_created_this_month": 3,
                "unlimited_access": true
            }
        }
    }
}
```

---

## ADMIN MANAGEMENT

### Get Dashboard Stats
```http
GET /admin/dashboard
```
**Headers:** `Authorization: Bearer {token}`  
**Access:** Admin only

**Response (200):**
```json
{
    "success": true,
    "data": {
        "users": {
            "total": 15420,
            "new_this_month": 1240,
            "active_this_month": 8350,
            "by_role": {
                "free": 12100,
                "premium": 3200,
                "admin": 20
            }
        },
        "scholarships": {
            "total": 2450,
            "active": 1890,
            "expiring_soon": 85,
            "pending_verification": 12
        },
        "subscriptions": {
            "total_revenue_this_month": 45680.50,
            "active_premium": 3200,
            "churn_rate": 5.2
        },
        "system": {
            "last_scrape": "2026-03-10T06:00:00Z",
            "scraping_errors": 3,
            "api_requests_today": 125000
        }
    }
}
```

### Manage Scholarships
```http
GET /admin/scholarships
PUT /admin/scholarships/{id}
DELETE /admin/scholarships/{id}
```

### Manage Users
```http
GET /admin/users
PUT /admin/users/{id}/role
PUT /admin/users/{id}/status
```

### Forum Moderation
```http
PUT /admin/forum/topics/{id}/status
DELETE /admin/forum/replies/{id}
```

---

## ERROR HANDLING

### Standard Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "The given data was invalid",
        "details": {
            "email": ["The email field is required"],
            "password": ["The password must be at least 8 characters"]
        }
    }
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request / Validation Error
- **401**: Unauthorized / Invalid Token
- **403**: Forbidden / Insufficient Permissions
- **404**: Not Found
- **422**: Unprocessable Entity / Validation Failed
- **429**: Too Many Requests / Rate Limited
- **500**: Internal Server Error

### Rate Limiting Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1646901600
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SUBSCRIPTION_REQUIRED`: Premium feature requires subscription
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `QUOTA_EXCEEDED`: User has exceeded their quota
- `MAINTENANCE_MODE`: System is under maintenance

---

## PAGINATION

All paginated endpoints follow this format:

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (max: 100, default: 15)

**Response Format:**
```json
{
    "data": [...],
    "pagination": {
        "current_page": 1,
        "per_page": 15,
        "total": 450,
        "total_pages": 30,
        "next_page_url": "/endpoint?page=2",
        "prev_page_url": null,
        "first_page_url": "/endpoint?page=1",
        "last_page_url": "/endpoint?page=30"
    }
}
```

---

## WEBHOOK ENDPOINTS (for external integrations)

### Stripe Webhook
```http
POST /webhooks/stripe
```

### Scraper Results Webhook (future)
```http
POST /webhooks/scraper
```

This endpoint is reserved for future external connector integration and is not part of the current production data flow.

**Request Body:**
```json
{
    "source": "scholarships.com",
    "status": "success",
    "scholarships_added": 25,
    "scholarships_updated": 12,
    "run_id": "uuid"
}
```