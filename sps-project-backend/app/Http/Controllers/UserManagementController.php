<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', Rule::in(User::ROLES)],
            'is_active' => ['nullable', Rule::in(['0', '1', 'true', 'false'])],
            'sort' => ['nullable', Rule::in(['newest', 'oldest', 'name'])],
            'per_page' => ['nullable', 'integer', Rule::in([5, 10, 15, 20, 25])],
        ]);

        $query = User::query();

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (array_key_exists('is_active', $filters)) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        match ($filters['sort'] ?? 'newest') {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'name' => $query->orderBy('name')->orderBy('id'),
            default => $query->orderByDesc('created_at')->orderByDesc('id'),
        };

        $users = $query->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'data' => UserResource::collection($users->getCollection())->resolve($request),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(User::ROLES)],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'is_active' => ['prohibited'],
            'id' => ['prohibited'],
            'user_id' => ['prohibited'],
            'token' => ['prohibited'],
            'remember_token' => ['prohibited'],
            'password_hash' => ['prohibited'],
            'created_at' => ['prohibited'],
            'deleted_at' => ['prohibited'],
        ], $this->validationMessages());

        $user = User::create([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'role' => $data['role'],
            'password' => $data['password'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'L’utilisateur a été créé avec succès.',
            'data' => (new UserResource($user))->resolve($request),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in(User::ROLES)],
            'password' => ['prohibited'],
            'is_active' => ['prohibited'],
            'id' => ['prohibited'],
            'user_id' => ['prohibited'],
            'token' => ['prohibited'],
            'remember_token' => ['prohibited'],
        ], $this->validationMessages());

        $updated = DB::transaction(function () use ($request, $user, $data) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($lockedUser->id === $request->user()->id && $lockedUser->role !== $data['role']) {
                throw ValidationException::withMessages([
                    'role' => ['Vous ne pouvez pas modifier votre propre rôle.'],
                ]);
            }

            if ($lockedUser->isAdmin() && $lockedUser->isActive() && $data['role'] !== User::ROLE_ADMIN) {
                $this->ensureAnotherActiveAdminExists($lockedUser->id);
            }

            $lockedUser->update([
                'name' => trim($data['name']),
                'email' => strtolower(trim($data['email'])),
                'role' => $data['role'],
            ]);

            return $lockedUser;
        });

        return response()->json([
            'message' => 'L’utilisateur a été modifié avec succès.',
            'data' => (new UserResource($updated))->resolve($request),
        ]);
    }

    public function status(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
            'role' => ['prohibited'],
            'id' => ['prohibited'],
            'user_id' => ['prohibited'],
            'target_user_id' => ['prohibited'],
            'token' => ['prohibited'],
        ], $this->validationMessages());

        $updated = DB::transaction(function () use ($request, $user, $data) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $activate = (bool) $data['is_active'];

            if (! $activate && $lockedUser->id === $request->user()->id) {
                throw ValidationException::withMessages([
                    'is_active' => ['Vous ne pouvez pas désactiver votre propre compte.'],
                ]);
            }

            if (! $activate && $lockedUser->isAdmin() && $lockedUser->isActive()) {
                $this->ensureAnotherActiveAdminExists($lockedUser->id);
            }

            $lockedUser->is_active = $activate;
            $lockedUser->save();

            if (! $activate) {
                $lockedUser->tokens()->delete();
            }

            return $lockedUser;
        });

        return response()->json([
            'message' => $updated->isActive()
                ? 'Le compte utilisateur a été activé.'
                : 'Le compte utilisateur a été désactivé et ses sessions ont été fermées.',
            'data' => (new UserResource($updated))->resolve($request),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'password' => ['Utilisez la page Mon profil pour modifier votre propre mot de passe.'],
            ]);
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'user_id' => ['prohibited'],
            'token' => ['prohibited'],
        ], $this->validationMessages());

        $user->password = $data['password'];
        $user->save();
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Le mot de passe a été réinitialisé. Les sessions actives de cet utilisateur ont été fermées.',
        ]);
    }

    private function ensureAnotherActiveAdminExists(int $excludedUserId): void
    {
        $anotherAdminExists = User::query()
            ->whereKeyNot($excludedUserId)
            ->where('role', User::ROLE_ADMIN)
            ->where('is_active', true)
            ->lockForUpdate()
            ->exists();

        if (! $anotherAdminExists) {
            throw ValidationException::withMessages([
                'role' => ['Le dernier administrateur actif ne peut pas être désactivé ou rétrogradé.'],
            ]);
        }
    }

    private function validationMessages(): array
    {
        return [
            'name.required' => 'Le nom complet est obligatoire.',
            'email.required' => 'L’adresse e-mail est obligatoire.',
            'email.email' => 'L’adresse e-mail doit être valide.',
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'role.required' => 'Le rôle est obligatoire.',
            'role.in' => 'Le rôle sélectionné est invalide.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'is_active.required' => 'Le statut du compte est obligatoire.',
        ];
    }
}
