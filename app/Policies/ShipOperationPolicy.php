<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ShipOperation;

class ShipOperationPolicy
{
    public function view(User $user, ShipOperation $shipOperation): bool
    {
        return $user->id === $shipOperation->user_id;
    }

    public function update(User $user, ShipOperation $shipOperation): bool
    {
        return $user->id === $shipOperation->user_id;
    }

    public function delete(User $user, ShipOperation $shipOperation): bool
    {
        return $user->id === $shipOperation->user_id;
    }
}
