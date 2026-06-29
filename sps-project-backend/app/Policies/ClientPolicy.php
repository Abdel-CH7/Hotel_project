<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Client;

class ClientPolicy
{

    public function viewAllClients(User $user)
    {
        return $user->hasPermission('view_all_clients');
    }
    public function viewClients(User $user)
    {
        return $user->hasPermission('view_clients');
    }

    public function createClient(User $user)
    {
        return $user->hasPermission('create_clients');
    }

    public function editClient(User $user)
    {
        return $user->hasPermission('update_clients');
    }

    public function deleteClient(User $user)
    {
        return $user->hasPermission('delete_clients');
    }
}
