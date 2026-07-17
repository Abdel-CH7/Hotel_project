<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAccountManagementTest extends TestCase
{
    use DatabaseTransactions;

    protected bool $authenticateApiRequests = false;

    public function test_active_user_can_login_but_inactive_user_cannot_receive_a_token(): void
    {
        $active = User::factory()->create(['email' => 'active@example.com']);
        $inactive = User::factory()->create([
            'email' => 'inactive@example.com',
            'is_active' => false,
        ]);

        $this->postJson('/api/login', [
            'email' => $active->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token', 'user']);

        $this->postJson('/api/login', [
            'email' => $inactive->email,
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('code', 'account_inactive')
            ->assertJsonMissingPath('token');

        $this->postJson('/api/register')->assertNotFound();
    }

    public function test_inactive_user_with_an_old_token_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('old-session')->plainTextToken;
        $user->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/profile')
            ->assertForbidden()
            ->assertJsonPath('code', 'account_inactive');
    }

    public function test_user_management_requires_an_authenticated_administrator(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();

        $staff = User::factory()->create(['role' => User::ROLE_STAFF]);
        Sanctum::actingAs($staff);
        $this->getJson('/api/users')->assertForbidden();

        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);
        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_admin_can_create_staff_and_admin_accounts_without_exposing_sensitive_fields(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);

        foreach ([User::ROLE_STAFF, User::ROLE_ADMIN] as $index => $role) {
            $response = $this->postJson('/api/users', [
                'name' => "Utilisateur {$role}",
                'email' => "account{$index}@example.com",
                'role' => $role,
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
            ])->assertCreated()
                ->assertJsonPath('data.role', $role)
                ->assertJsonMissingPath('data.password')
                ->assertJsonMissingPath('data.remember_token');

            $created = User::findOrFail($response->json('data.id'));
            $this->assertTrue(Hash::check('secret123', $created->password));
        }

        $this->postJson('/api/users', [
            'name' => 'Doublon',
            'email' => 'account0@example.com',
            'role' => User::ROLE_STAFF,
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/users', [
            'name' => 'Rôle invalide',
            'email' => 'invalid-role@example.com',
            'role' => 'superadmin',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_admin_safety_rules_and_deactivation_token_revocation_are_enforced(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $otherAdmin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $staff = User::factory()->create(['role' => User::ROLE_STAFF]);
        $staff->createToken('staff-session');
        Sanctum::actingAs($admin);

        $this->patchJson("/api/users/{$admin->id}/status", ['is_active' => false])
            ->assertUnprocessable()->assertJsonValidationErrors('is_active');

        $this->putJson("/api/users/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => User::ROLE_STAFF,
        ])->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->patchJson("/api/users/{$staff->id}/status", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('users', ['id' => $staff->id, 'deleted_at' => null]);
        $this->assertSame(0, $staff->tokens()->count());

        $this->putJson("/api/users/{$otherAdmin->id}", [
            'name' => $otherAdmin->name,
            'email' => $otherAdmin->email,
            'role' => User::ROLE_STAFF,
        ])->assertOk()->assertJsonPath('data.role', User::ROLE_STAFF);

        $this->patchJson("/api/users/{$admin->id}/status", ['is_active' => false])
            ->assertUnprocessable();
    }

    public function test_admin_password_reset_hashes_password_and_revokes_target_sessions(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $staff = User::factory()->create();
        $staff->createToken('staff-session');
        Sanctum::actingAs($admin);

        $this->patchJson("/api/users/{$staff->id}/reset-password", [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk()->assertJsonMissingPath('password');

        $this->assertTrue(Hash::check('new-password', $staff->fresh()->password));
        $this->assertSame(0, $staff->tokens()->count());
    }

    public function test_user_can_manage_only_their_own_profile_and_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['email' => 'profile@example.com']);
        Sanctum::actingAs($user);

        $this->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonMissingPath('password');

        $this->putJson('/api/profile', [
            'name' => 'Nom actualisé',
            'email' => 'updated@example.com',
        ])->assertOk()->assertJsonPath('user.name', 'Nom actualisé');

        $this->putJson('/api/profile', [
            'name' => 'Tentative',
            'email' => 'updated@example.com',
            'role' => User::ROLE_ADMIN,
        ])->assertUnprocessable()->assertJsonValidationErrors('role');

        User::factory()->create(['email' => 'already-used@example.com']);
        $this->putJson('/api/profile', [
            'name' => 'Nom actualisé',
            'email' => 'already-used@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->putJson("/api/profile/{$user->id}", [])->assertNotFound();

        $this->putJson('/api/profile/password', [
            'current_password' => 'incorrect',
            'password' => 'another-password',
            'password_confirmation' => 'another-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->putJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'another-password',
            'password_confirmation' => 'another-password',
        ])->assertOk();
        $this->assertTrue(Hash::check('another-password', $user->fresh()->password));

        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
        $firstPhoto = UploadedFile::fake()->createWithContent('first.png', $png);
        $upload = $this->post('/api/profile/photo', ['photo' => $firstPhoto], ['Accept' => 'application/json'])
            ->assertOk();
        $firstPath = $upload->json('user.photo');
        Storage::disk('public')->assertExists($firstPath);

        $secondPhoto = UploadedFile::fake()->createWithContent('second.png', $png);
        $replacement = $this->post('/api/profile/photo', ['photo' => $secondPhoto], ['Accept' => 'application/json'])
            ->assertOk();
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($replacement->json('user.photo'));

        $this->deleteJson('/api/profile/photo')->assertOk()->assertJsonPath('user.photo', null);

        $invalidPhoto = UploadedFile::fake()->createWithContent('document.txt', 'not an image');
        $this->post('/api/profile/photo', ['photo' => $invalidPhoto], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('photo');
    }

    public function test_profile_password_change_preserves_the_current_bearer_token_and_revokes_others(): void
    {
        $user = User::factory()->create();
        $currentToken = $user->createToken('current-browser')->plainTextToken;
        $user->createToken('other-browser');

        $this->withToken($currentToken)->putJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ])->assertOk()->assertJsonPath('session_preserved', true);

        $this->assertSame(1, $user->tokens()->count());
        $this->withToken($currentToken)->getJson('/api/profile')->assertOk();
    }
}
