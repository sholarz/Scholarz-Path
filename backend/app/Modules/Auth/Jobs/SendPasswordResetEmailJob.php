<?php

namespace App\Modules\Auth\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendPasswordResetEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user, public string $token)
    {
    }

    public function handle(): void
    {
        // Placeholder mail implementation to keep reset flow reliable.
        Log::info('Password reset email queued.', [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
            'token_preview' => substr($this->token, 0, 8),
        ]);
    }
}
