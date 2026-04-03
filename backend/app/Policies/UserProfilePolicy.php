<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserProfile;

class UserProfilePolicy
{
    public function view(User $user, UserProfile $profile): bool
    {
        return $user->isAdmin() || $profile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->status === 'active' || $user->isAdmin();
    }

    public function update(User $user, UserProfile $profile): bool
    {
        return $this->view($user, $profile);
    }

    public function delete(User $user, UserProfile $profile): bool
    {
        return $this->view($user, $profile);
    }
}