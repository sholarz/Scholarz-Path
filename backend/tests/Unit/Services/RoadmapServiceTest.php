<?php

namespace Tests\Unit\Services;

use App\Models\DailyTask;
use App\Models\Roadmap;
use App\Models\Scholarship;
use App\Models\ScholarshipProvider;
use App\Models\User;
use App\Modules\Roadmap\Services\RoadmapService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoadmapServiceTest extends TestCase
{
    use RefreshDatabase;

    private RoadmapService $roadmapService;
    private Scholarship $scholarship;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->roadmapService = new RoadmapService();
        $this->user = User::factory()->create();

        $provider = ScholarshipProvider::create([
            'name' => 'Test Provider',
            'country' => 'Indonesia',
        ]);

        $this->scholarship = Scholarship::create([
            'provider_id' => $provider->id,
            'title' => 'Test Scholarship',
            'description' => 'Test',
            'amount' => 100000000,
            'currency' => 'IDR',
            'type' => 'full',
            'level' => 'bachelor',
            'application_deadline' => now()->addDays(60)->toDateString(),
            'application_url' => 'https://example.com',
            'status' => 'active',
        ]);
    }

    /**
     * Test generate roadmap creates roadmap record
     */
    public function test_generate_roadmap_creates_roadmap(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $this->assertNotNull($roadmap->id);
        $this->assertInstanceOf(Roadmap::class, $roadmap);
        $this->assertEquals($this->user->id, $roadmap->user_id);
        $this->assertEquals($this->scholarship->id, $roadmap->scholarship_id);
    }

    /**
     * Test generate roadmap creates tasks
     */
    public function test_generate_roadmap_creates_daily_tasks(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)->get();

        $this->assertGreaterThan(0, $tasks->count());
    }

    /**
     * Test roadmap with 60 days creates 5 tasks
     */
    public function test_roadmap_60_days_creates_5_tasks(): void
    {
        $this->scholarship->update([
            'application_deadline' => now()->addDays(60)->toDateString(),
        ]);

        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)->get();

        $this->assertEquals(5, $tasks->count());
    }

    /**
     * Test roadmap with less than 14 days creates 3 tasks
     */
    public function test_roadmap_less_than_14_days_creates_3_tasks(): void
    {
        $this->scholarship->update([
            'application_deadline' => now()->addDays(10)->toDateString(),
        ]);

        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)->get();

        $this->assertEquals(3, $tasks->count());
    }

    /**
     * Test roadmap with 14-30 days creates 4 tasks
     */
    public function test_roadmap_14_to_30_days_creates_4_tasks(): void
    {
        $this->scholarship->update([
            'application_deadline' => now()->addDays(20)->toDateString(),
        ]);

        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)->get();

        $this->assertEquals(4, $tasks->count());
    }

    /**
     * Test roadmap task titles are meaningful
     */
    public function test_roadmap_tasks_have_meaningful_titles(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)->get();

        $titles = $tasks->pluck('title')->toArray();

        // Check that at least one task title contains expected keywords
        $this->assertTrue(
            collect($titles)->contains(fn($title) => str_contains(strtolower($title), 'dokumen')) ||
            collect($titles)->contains(fn($title) => str_contains(strtolower($title), 'personal'))
        );
    }

    /**
     * Test roadmap status is active
     */
    public function test_roadmap_status_is_active(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $this->assertEquals('active', $roadmap->status);
    }

    /**
     * Test roadmap deadline matches scholarship deadline
     */
    public function test_roadmap_deadline_matches_scholarship(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $this->assertEquals(
            $this->scholarship->application_deadline,
            $roadmap->deadline->toDateString()
        );
    }

    /**
     * Test task due dates are spread across days
     */
    public function test_task_due_dates_are_spread_out(): void
    {
        $this->scholarship->update([
            'application_deadline' => now()->addDays(60)->toDateString(),
        ]);

        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)
            ->orderBy('day_number')
            ->get();

        // Check that due dates are different and spread out
        $dueDates = $tasks->pluck('due_date')->unique()->count();
        $this->assertGreaterThan(1, $dueDates); // At least 2 different dates
    }

    /**
     * Test last task due date is before scholarship deadline
     */
    public function test_last_task_due_date_before_deadline(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $lastTask = DailyTask::where('roadmap_id', $roadmap->id)
            ->orderBy('day_number', 'desc')
            ->first();

        $deadline = Carbon::parse($this->scholarship->application_deadline);

        $this->assertTrue(Carbon::parse($lastTask->due_date) < $deadline);
    }

    /**
     * Test get daily tasks returns tasks for today
     */
    public function test_get_daily_tasks_returns_today_tasks(): void
    {
        // Create roadmap with a task due today
        $data = ['scholarship_id' => $this->scholarship->id];
        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        // Update one task to be due today
        $task = DailyTask::where('roadmap_id', $roadmap->id)->first();
        $task->update(['due_date' => Carbon::today()]);

        $dailyTasks = $this->roadmapService->getDailyTasks($this->user->id);

        $this->assertGreaterThan(0, $dailyTasks->count());
        $this->assertTrue($dailyTasks->every(fn($t) => $t->due_date->isToday()));
    }

    /**
     * Test get daily tasks returns empty for inactive roadmap
     */
    public function test_get_daily_tasks_ignores_inactive_roadmaps(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];
        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        // Update roadmap to inactive
        $roadmap->update(['status' => 'completed']);

        $task = DailyTask::where('roadmap_id', $roadmap->id)->first();
        $task->update(['due_date' => Carbon::today()]);

        $dailyTasks = $this->roadmapService->getDailyTasks($this->user->id);

        $this->assertEquals(0, $dailyTasks->count());
    }

    /**
     * Test get daily tasks returns empty if no tasks for today
     */
    public function test_get_daily_tasks_returns_empty_if_no_tasks_today(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];
        $this->roadmapService->generateRoadmap($data, $this->user->id);

        $dailyTasks = $this->roadmapService->getDailyTasks($this->user->id);

        $this->assertEquals(0, $dailyTasks->count());
    }

    /**
     * Test get daily tasks only returns for specific user
     */
    public function test_get_daily_tasks_only_returns_user_tasks(): void
    {
        $otherUser = User::factory()->create();

        $data = ['scholarship_id' => $this->scholarship->id];
        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $task = DailyTask::where('roadmap_id', $roadmap->id)->first();
        $task->update(['due_date' => Carbon::today()]);

        $userTasks = $this->roadmapService->getDailyTasks($this->user->id);
        $otherUserTasks = $this->roadmapService->getDailyTasks($otherUser->id);

        $this->assertGreaterThan(0, $userTasks->count());
        $this->assertEquals(0, $otherUserTasks->count());
    }

    /**
     * Test tasks have day_number sequentially
     */
    public function test_tasks_have_sequential_day_numbers(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $tasks = DailyTask::where('roadmap_id', $roadmap->id)
            ->orderBy('day_number')
            ->get();

        foreach ($tasks as $index => $task) {
            $this->assertEquals($index + 1, $task->day_number);
        }
    }

    /**
     * Test roadmap load includes daily tasks
     */
    public function test_roadmap_includes_daily_tasks_on_load(): void
    {
        $data = ['scholarship_id' => $this->scholarship->id];

        $roadmap = $this->roadmapService->generateRoadmap($data, $this->user->id);

        $this->assertNotNull($roadmap->dailyTasks);
        $this->assertGreaterThan(0, $roadmap->dailyTasks->count());
    }
}
