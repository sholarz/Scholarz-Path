<?php

namespace App\Modules\Roadmap\Services;

use App\Models\DailyTask;
use App\Models\Roadmap;
use App\Models\Scholarship;
use Carbon\Carbon;
use Illuminate\Support\Str;

class RoadmapService
{
    /**
     * Generate roadmap dari scholarship yang dipilih user.
     * Logic: ambil deadline → bagi jadi 3–5 task → simpan ke DB
     */
    public function generateRoadmap(array $data, string $userId): Roadmap
    {
        $scholarship = Scholarship::findOrFail($data['scholarship_id']);

        $deadline = Carbon::parse($scholarship->application_deadline);
        $today = Carbon::today();
        $daysLeft = $today->diffInDays($deadline);

        // Buat roadmap
        $roadmap = Roadmap::create([
            'user_id'       => $userId,
            'scholarship_id' => $scholarship->id,
            'title'         => 'Roadmap: ' . $scholarship->title,
            'description'   => 'Auto-generated roadmap untuk ' . $scholarship->title,
            'deadline'      => $deadline,
            'status'        => 'active',
        ]);

        // Generate 3–5 tasks berdasarkan sisa hari
        $tasks = $this->generateTasks($daysLeft);
        $this->saveTasks($roadmap->id, $tasks, $today, $deadline);

        return $roadmap->load('dailyTasks');
    }

    /**
     * Buat daftar task sesuai sisa waktu
     */
    private function generateTasks(int $daysLeft): array
    {
        $taskTemplates = [
            ['title' => 'Kumpulkan dokumen persyaratan', 'description' => 'Siapkan transkrip, sertifikat, dan dokumen pendukung lainnya'],
            ['title' => 'Tulis personal statement / esai', 'description' => 'Draft dan revisi esai motivasi atau personal statement'],
            ['title' => 'Minta surat rekomendasi', 'description' => 'Hubungi dosen/atasan untuk surat rekomendasi'],
            ['title' => 'Isi formulir aplikasi online', 'description' => 'Lengkapi semua bagian formulir pendaftaran'],
            ['title' => 'Review dan submit aplikasi', 'description' => 'Cek ulang semua berkas lalu submit sebelum deadline'],
        ];

        // Tentukan jumlah task: 3 jika waktu sempit, 5 jika cukup
        $taskCount = $daysLeft < 14 ? 3 : ($daysLeft < 30 ? 4 : 5);
        return array_slice($taskTemplates, 0, $taskCount);
    }

    /**
     * Simpan tasks ke DB dengan due_date yang tersebar rata
     */
    private function saveTasks(string $roadmapId, array $tasks, Carbon $start, Carbon $deadline): void
    {
        $count = count($tasks);
        $totalDays = $start->diffInDays($deadline);
        $interval = max(1, (int) floor($totalDays / $count));

        foreach ($tasks as $index => $task) {
            // Task terakhir selalu 1 hari sebelum deadline
            if ($index === $count - 1) {
                $dueDate = $deadline->copy()->subDay();
            } else {
                $dueDate = $start->copy()->addDays($interval * ($index + 1));
            }

            DailyTask::create([
                'roadmap_id'  => $roadmapId,
                'title'       => $task['title'],
                'description' => $task['description'],
                'due_date'    => $dueDate,
                'day_number'  => $index + 1,
                'status'      => 'pending',
            ]);
        }
    }

    /**
     * Ambil semua task yang due_date-nya hari ini untuk user tertentu
     */
    public function getDailyTasks(string $userId): \Illuminate\Database\Eloquent\Collection
    {
        return DailyTask::whereHas('roadmap', function ($q) use ($userId) {
                $q->where('user_id', $userId)->where('status', 'active');
            })
            ->where('due_date', Carbon::today())
            ->with('roadmap:id,title')
            ->orderBy('day_number')
            ->get();
    }
}