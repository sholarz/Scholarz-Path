<?php

namespace App\Modules\Auth\Jobs;

use App\Models\User;
use App\Modules\Auth\Mail\PasswordResetMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendPasswordResetEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public User $user, public string $token)
    {
    }

    public function handle(): void
    {
        $frontendBaseUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $resetUrl = $frontendBaseUrl.'/reset-password?token='.urlencode($this->token).'&email='.urlencode($this->user->email);

        Mail::to($this->user->email)->send(new PasswordResetMail(
            user: $this->user,
            resetUrl: $resetUrl,
            token: $this->token,
        ));

        Log::info('Password reset email sent.', [
            'user_id' => $this->user->id,
            'email' => $this->user->email,
        ]);
    }
}
