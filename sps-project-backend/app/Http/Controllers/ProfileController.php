<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json((new UserResource($request->user()))->resolve($request));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['prohibited'],
            'is_active' => ['prohibited'],
            'user_id' => ['prohibited'],
            'id' => ['prohibited'],
            'password' => ['prohibited'],
        ], $this->validationMessages());

        $user->update([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
        ]);

        return response()->json([
            'message' => 'Votre profil a été mis à jour.',
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['prohibited'],
            'is_active' => ['prohibited'],
            'user_id' => ['prohibited'],
        ], $this->validationMessages());

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        if (Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Le nouveau mot de passe doit être différent du mot de passe actuel.'],
            ]);
        }

        $user->password = $data['password'];
        $user->save();

        $currentToken = $user->currentAccessToken();
        $sessionPreserved = $currentToken instanceof PersonalAccessToken;

        if ($sessionPreserved) {
            $user->tokens()->whereKeyNot($currentToken->getKey())->delete();
        } else {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $sessionPreserved
                ? 'Votre mot de passe a été modifié. Vos autres sessions ont été fermées.'
                : 'Votre mot de passe a été modifié. Veuillez vous reconnecter.',
            'session_preserved' => $sessionPreserved,
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ], $this->validationMessages());

        $user = $request->user();
        $previousPhoto = $user->photo;
        $path = $request->file('photo')->store('user-photos', 'public');

        $user->photo = $path;
        $user->save();
        $this->deleteOwnedPhoto($previousPhoto);

        return response()->json([
            'message' => 'Votre photo de profil a été mise à jour.',
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }

    public function removePhoto(Request $request): JsonResponse
    {
        $user = $request->user();
        $previousPhoto = $user->photo;

        $user->photo = null;
        $user->save();
        $this->deleteOwnedPhoto($previousPhoto);

        return response()->json([
            'message' => 'Votre photo de profil a été supprimée.',
            'user' => (new UserResource($user))->resolve($request),
        ]);
    }

    private function deleteOwnedPhoto(?string $path): void
    {
        if ($path && str_starts_with($path, 'user-photos/')) {
            Storage::disk('public')->delete($path);
        }
    }

    private function validationMessages(): array
    {
        return [
            'name.required' => 'Le nom complet est obligatoire.',
            'email.required' => 'L’adresse e-mail est obligatoire.',
            'email.email' => 'L’adresse e-mail doit être valide.',
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'current_password.required' => 'Le mot de passe actuel est obligatoire.',
            'password.required' => 'Le nouveau mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'photo.required' => 'Veuillez choisir une photo.',
            'photo.image' => 'Le fichier sélectionné doit être une image.',
            'photo.mimes' => 'La photo doit être au format JPEG, JPG, PNG ou WebP.',
            'photo.max' => 'La photo ne doit pas dépasser 2 Mo.',
        ];
    }
}
