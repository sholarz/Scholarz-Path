<?php

namespace Tests\Feature;

use App\Models\ForumCategory;
use App\Models\ForumComment;
use App\Models\ForumPost;
use App\Models\ForumReport;
use App\Models\ForumReply;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForumBackendBTest extends TestCase
{
    use RefreshDatabase;

    public function test_comments_replies_reports_and_admin_moderation_flow(): void
    {
        $author = User::factory()->create(['role' => 'free']);
        $commenter = User::factory()->create(['role' => 'free']);
        $admin = User::factory()->create(['role' => 'admin']);

        $category = ForumCategory::create([
            'name' => 'Q&A',
            'slug' => 'qa',
            'description' => 'Questions and answers',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $approvedPost = ForumPost::create([
            'author_id' => $author->id,
            'forum_category_id' => $category->id,
            'title' => 'Approved post',
            'content' => 'Approved post content',
            'tags' => ['help'],
            'status' => 'approved',
        ]);

        $pendingPost = ForumPost::create([
            'author_id' => $author->id,
            'forum_category_id' => $category->id,
            'title' => 'Pending post',
            'content' => 'Pending post content',
            'tags' => ['review'],
            'status' => 'pending',
        ]);

        $commentResponse = $this->actingAs($commenter, 'sanctum')
            ->postJson("/api/forum/posts/{$approvedPost->id}/comments", [
                'content' => 'This is a helpful comment.',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $commentId = $commentResponse->json('data.comment.id');
        $this->assertDatabaseHas('forum_comments', [
            'id' => $commentId,
            'post_id' => $approvedPost->id,
            'author_id' => $commenter->id,
        ]);

        $this->actingAs($commenter, 'sanctum')
            ->postJson("/api/forum/comments/{$commentId}/like")
            ->assertOk()
            ->assertJsonPath('data.liked', true);

        $replyResponse = $this->actingAs($author, 'sanctum')
            ->postJson("/api/forum/comments/{$commentId}/replies", [
                'content' => 'Thanks for the comment.',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $replyId = $replyResponse->json('data.reply.id');
        $this->assertDatabaseHas('forum_replies', [
            'id' => $replyId,
            'comment_id' => $commentId,
            'author_id' => $author->id,
        ]);

        $reportResponse = $this->actingAs($commenter, 'sanctum')
            ->postJson("/api/forum/posts/{$approvedPost->id}/report", [
                'reason' => 'spam',
                'description' => 'This post looks like spam.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $reportId = $reportResponse->json('data.report.id');
        $this->assertDatabaseHas('forum_reports', [
            'id' => $reportId,
            'reporter_user_id' => $commenter->id,
            'target_type' => 'post',
            'target_id' => $approvedPost->id,
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/forum/reports')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/forum/reports/{$reportId}/review", [
                'status' => 'resolved',
                'action' => 'remove-content',
                'notes' => 'Removed spam post.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');

        $this->assertDatabaseMissing('forum_posts', [
            'id' => $approvedPost->id,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/forum/posts/pending')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/forum/posts/{$pendingPost->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $rejectTarget = ForumPost::create([
            'author_id' => $author->id,
            'forum_category_id' => $category->id,
            'title' => 'Second pending post',
            'content' => 'Another pending post',
            'tags' => ['review'],
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/forum/posts/{$rejectTarget->id}/reject")
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->actingAs($commenter, 'sanctum')
            ->putJson("/api/forum/posts/{$pendingPost->id}", [
                'title' => 'Hacked title',
            ])
            ->assertStatus(403);

        $this->actingAs($commenter, 'sanctum')
            ->deleteJson("/api/forum/posts/{$pendingPost->id}")
            ->assertStatus(403);

        $this->assertDatabaseMissing('forum_comments', [
            'id' => $commentId,
        ]);

        $this->assertDatabaseMissing('forum_replies', [
            'id' => $replyId,
        ]);
    }

    public function test_author_can_update_and_delete_own_post(): void
    {
        $author = User::factory()->create(['role' => 'free']);
        $admin = User::factory()->create(['role' => 'admin']);

        $category = ForumCategory::create([
            'name' => 'Announcements',
            'slug' => 'announcements',
            'description' => 'Announcements',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $post = ForumPost::create([
            'author_id' => $author->id,
            'forum_category_id' => $category->id,
            'title' => 'Original title',
            'content' => 'Original content',
            'tags' => ['alpha'],
            'status' => 'pending',
        ]);

        $this->actingAs($author, 'sanctum')
            ->putJson("/api/forum/posts/{$post->id}", [
                'title' => 'Updated title',
                'content' => 'Updated content',
                'category' => 'Announcements',
                'tags' => ['beta', 'gamma'],
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated title');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/forum/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('forum_posts', [
            'id' => $post->id,
        ]);
    }
}