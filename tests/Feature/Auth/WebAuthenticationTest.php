<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class WebAuthenticationTest extends TestCase
{
    use CreatesUsers;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $admin = $this->createAdmin([
            'email' => 'admin@masarat.test',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => 'admin@masarat.test',
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($admin);
        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $admin = $this->createAdmin([
            'email' => 'admin@masarat.test',
            'password' => bcrypt('password123'),
        ]);

        $this->post('/login', [
            'email' => 'admin@masarat.test',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
