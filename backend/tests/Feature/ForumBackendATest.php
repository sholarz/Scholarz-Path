<?php

namespace Tests\Feature;

use App\Models\ForumCategory;
use App\Models\ForumPost;
use App\Models\ForumPostLike;
use App\Models\ForumPostSave;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumBackendATest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private function makeCategory(array $overrides = []): ForumCategory
    {
        return ForumCategory::create(array_merge([
            'name'        => 'General Discussion',
            'slug'        => 'general-discussion',
            'description' => 'General community discussion',
            'sort_order'  => 1,
            'is_active'   => true,
        ], $overrides));
    }

    private function makeApprovedPost(User $author, ForumCategory $category, array $overrides = []): ForumPost
    {
        return ForumPost::create(array_merge([
            'author_id'         => $author->id,
            'forum_category_id' => $category->id,
            'title'             => 'Test Post Title',
            'content'           => 'Test post content body.',
            'tags'              => ['test'],
            'status'            => 'approved',
        ], $overrides));
    }

    // =========================================================================
    // GET /api/forum/categories
    // =========================================================================

    public function test_get_categories_returns_list(): void
    {
        $user = User::factory()->create();

        $this->makeCategory(['name' => 'Tips & Experience', 'slug' => 'tips-experience', 'sort_order' => 1]);
        $this->makeCategory(['name' => 'Q&A',              'slug' => 'qa',              'sort_order' => 2]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/categories')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [['id', 'name', 'slug', 'description', 'sort_order', 'is_active']],
            ]);
    }

    public function test_get_categories_returns_defaults_when_empty(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/categories')
            ->assertOk()
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);
    }

    // =========================================================================
    // GET /api/forum/posts
    // =========================================================================

    public function test_list_posts_returns_approved_posts_for_regular_user(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();

        $this->makeApprovedPost($user, $category, ['title' => 'Approved Post']);
        $this->makeApprovedPost($user, $category, ['title' => 'Pending Post', 'status' => 'pending']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/posts')
            ->assertOk()
            ->assertJsonPath('success', true);

        $titles = collect($response->json('data.posts'))->pluck('title')->all();
        $this->assertContains('Approved Post', $titles);
        $this->assertNotContains('Pending Post', $titles);
    }

    public function test_list_posts_admin_sees_all_statuses(): void
    {
        $admin    = User::factory()->create(['role' => 'admin']);
        $category = $this->makeCategory();

        $this->makeApprovedPost($admin, $category, ['title' => 'Approved']);
        $this->makeApprovedPost($admin, $category, ['title' => 'Pending', 'status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/forum/posts')
            ->assertOk();

        $titles = collect($response->json('data.posts'))->pluck('title')->all();
        $this->assertContains('Approved', $titles);
        $this->assertContains('Pending', $titles);
    }

    public function test_list_posts_filter_by_category(): void
    {
        $user = User::factory()->create(['role' => 'free']);
        $cat1 = $this->makeCategory(['name' => 'Tips & Experience', 'slug' => 'tips-experience']);
        $cat2 = ForumCategory::create([
            'name' => 'Q&A', 'slug' => 'qa',
            'description' => null, 'sort_order' => 2, 'is_active' => true,
        ]);

        $this->makeApprovedPost($user, $cat1, ['title' => 'Tips Post']);
        $this->makeApprovedPost($user, $cat2, ['title' => 'QA Post']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/posts?category=tips-experience')
            ->assertOk();

        $titles = collect($response->json('data.posts'))->pluck('title')->all();
        $this->assertContains('Tips Post', $titles);
        $this->assertNotContains('QA Post', $titles);
    }

    public function test_list_posts_search_by_keyword(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();

        $this->makeApprovedPost($user, $category, ['title' => 'IELTS Tips', 'content' => 'Study hard.']);
        $this->makeApprovedPost($user, $category, ['title' => 'Random Post', 'content' => 'Nothing here.']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/posts?search=IELTS')
            ->assertOk();

        $titles = collect($response->json('data.posts'))->pluck('title')->all();
        $this->assertContains('IELTS Tips', $titles);
        $this->assertNotContains('Random Post', $titles);
    }

    public function test_list_posts_sort_popular(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();

        $this->makeApprovedPost($user, $category, ['title' => 'Popular Post', 'likes_count' => 50]);
        $this->makeApprovedPost($user, $category, ['title' => 'Recent Post',  'likes_count' => 1]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/posts?sort=popular')
            ->assertOk();

        $titles = collect($response->json('data.posts'))->pluck('title')->values();
        $this->assertEquals('Popular Post', $titles[0]);
    }

    public function test_list_posts_sort_latest_is_default(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();

        $this->makeApprovedPost($user, $category, ['title' => 'Old Post', 'created_at' => now()->subMinute()]);
        $this->makeApprovedPost($user, $category, ['title' => 'New Post']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/posts?sort=latest')
            ->assertOk();

        $titles = collect($response->json('data.posts'))->pluck('title')->values();
        $this->assertEquals('New Post', $titles[0]);
    }

    public function test_list_posts_has_pagination(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();

        for ($i = 1; $i <= 5; $i++) {
            $this->makeApprovedPost($user, $category, ['title' => "Post {$i}"]);
        }

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/forum/posts?per_page=2')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'posts',
                    'pagination' => ['current_page', 'per_page', 'total', 'last_page'],
                ],
            ]);
    }

    // =========================================================================
    // POST /api/forum/posts
    // =========================================================================

    public function test_create_post_by_regular_user_status_is_pending(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/forum/posts', [
                'title'    => 'My First Post',
                'content'  => 'This is the content of my first post.',
                'category' => $category->name,
                'tags'     => ['scholarship', 'tips'],
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('forum_posts', [
            'title'     => 'My First Post',
            'author_id' => $user->id,
            'status'    => 'pending',
        ]);
    }

    public function test_create_post_by_admin_status_is_approved(): void
    {
        $admin    = User::factory()->create(['role' => 'admin']);
        $category = $this->makeCategory();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/forum/posts', [
                'title'    => 'Admin Announcement',
                'content'  => 'Important update.',
                'category' => $category->name,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_create_post_validation_fails_without_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/forum/posts', [])
            ->assertUnprocessable();
    }

    // =========================================================================
    // GET /api/forum/posts/{id}
    // =========================================================================

    public function test_get_post_detail_approved(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($user, $category);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/forum/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $post->id);
    }

    public function test_get_pending_post_forbidden_for_non_author(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $visitor  = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category, ['status' => 'pending']);

        $this->actingAs($visitor, 'sanctum')
            ->getJson("/api/forum/posts/{$post->id}")
            ->assertForbidden();
    }

    public function test_get_pending_post_visible_to_its_author(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category, ['status' => 'pending']);

        $this->actingAs($author, 'sanctum')
            ->getJson("/api/forum/posts/{$post->id}")
            ->assertOk();
    }

    // =========================================================================
    // PUT /api/forum/posts/{id}
    // =========================================================================

    public function test_author_can_update_own_post(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category);

        $this->actingAs($author, 'sanctum')
            ->putJson("/api/forum/posts/{$post->id}", [
                'title'   => 'Updated Title',
                'content' => 'Updated content.',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated Title');
    }

    public function test_non_author_cannot_update_post(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $stranger = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category);

        $this->actingAs($stranger, 'sanctum')
            ->putJson("/api/forum/posts/{$post->id}", ['title' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_admin_can_update_any_post(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $admin    = User::factory()->create(['role' => 'admin']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/forum/posts/{$post->id}", ['title' => 'Admin Edit'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Admin Edit');
    }

    // =========================================================================
    // DELETE /api/forum/posts/{id}
    // =========================================================================

    public function test_author_can_delete_own_post(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category);

        $this->actingAs($author, 'sanctum')
            ->deleteJson("/api/forum/posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('forum_posts', ['id' => $post->id]);
    }

    public function test_non_author_cannot_delete_post(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $stranger = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category);

        $this->actingAs($stranger, 'sanctum')
            ->deleteJson("/api/forum/posts/{$post->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('forum_posts', ['id' => $post->id]);
    }

    public function test_admin_can_delete_any_post(): void
    {
        $author   = User::factory()->create(['role' => 'free']);
        $admin    = User::factory()->create(['role' => 'admin']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($author, $category);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/forum/posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('forum_posts', ['id' => $post->id]);
    }

    // =========================================================================
    // POST /api/forum/posts/{id}/like
    // =========================================================================

    public function test_toggle_like_adds_like(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($user, $category);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/forum/posts/{$post->id}/like")
            ->assertOk()
            ->assertJsonPath('data.liked', true);

        $this->assertDatabaseHas('forum_post_likes', [
            'post_id' => $post->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_toggle_like_removes_like_on_second_call(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($user, $category);

        $this->actingAs($user, 'sanctum')->postJson("/api/forum/posts/{$post->id}/like");

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/forum/posts/{$post->id}/like")
            ->assertOk()
            ->assertJsonPath('data.liked', false);

        $this->assertDatabaseMissing('forum_post_likes', [
            'post_id' => $post->id,
            'user_id' => $user->id,
        ]);
    }

    // =========================================================================
    // POST /api/forum/posts/{id}/save
    // =========================================================================

    public function test_toggle_save_bookmarks_post(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($user, $category);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/forum/posts/{$post->id}/save")
            ->assertOk()
            ->assertJsonPath('data.saved', true);

        $this->assertDatabaseHas('forum_post_saves', [
            'post_id' => $post->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_toggle_save_removes_bookmark_on_second_call(): void
    {
        $user     = User::factory()->create(['role' => 'free']);
        $category = $this->makeCategory();
        $post     = $this->makeApprovedPost($user, $category);

        $this->actingAs($user, 'sanctum')->postJson("/api/forum/posts/{$post->id}/save");

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/forum/posts/{$post->id}/save")
            ->assertOk()
            ->assertJsonPath('data.saved', false);
    }
}