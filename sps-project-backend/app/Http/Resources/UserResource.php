<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => $this->role === User::ROLE_ADMIN ? 'Administrateur' : 'Employé',
            'is_active' => (bool) $this->is_active,
            'photo' => $this->photo,
            'photo_url' => $this->photo ? Storage::disk('public')->url($this->photo) : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
