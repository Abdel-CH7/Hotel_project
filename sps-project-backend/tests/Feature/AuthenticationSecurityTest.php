<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthenticationSecurityTest extends TestCase
{
    use DatabaseTransactions;

    protected bool $authenticateApiRequests = false;

    public function test_login_is_the_only_public_api_entry_point_and_returns_safe_user_data(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/register', [
            'name' => 'Compte public',
            'email' => 'public@example.com',
            'password' => 'password',
        ])->assertNotFound();

        $this->getJson('/api/reservations')->assertUnauthorized();
        $this->postJson('/api/reservations/1/payments', [])->assertUnauthorized();
        $this->patchJson('/api/reservations/1/payments/1/cancel', [])->assertUnauthorized();

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['token', 'user']);

        $login->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.remember_token');

        $token = $login->json('token');
        $this->withToken($token)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonMissingPath('password')
            ->assertJsonMissingPath('remember_token');

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_invalid_credentials_return_the_neutral_french_message(): void
    {
        User::factory()->create(['email' => 'reception@example.com']);

        $this->postJson('/api/login', [
            'email' => 'reception@example.com',
            'password' => 'mot-de-passe-incorrect',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Adresse e-mail ou mot de passe incorrect.')
            ->assertJsonPath('errors.email.0', 'Adresse e-mail ou mot de passe incorrect.');
    }
}
