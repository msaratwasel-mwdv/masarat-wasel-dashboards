<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Tests\Traits\CreatesUsers;

class ApiAuthenticationTest extends TestCase
{
    use CreatesUsers;

    public function test_driver_can_login_via_api_with_valid_credentials(): void
    {
        $driver = $this->createDriver([
            'national_id' => '1020304050',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'national_id' => '1020304050',
            'password' => 'secret123',
            'device_name' => 'Driver Phone',
            'app_context' => 'services',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'role',
                    ],
                ],
            ]);

        $this->assertEquals(1, $driver->tokens()->count());
    }

    public function test_parent_cannot_login_into_services_app(): void
    {
        $guardian = $this->createGuardian([
            'national_id' => '1099887766',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'national_id' => '1099887766',
            'password' => 'secret123',
            'device_name' => 'Parent Phone',
            'app_context' => 'services', // Trying to enter services app as parent
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_driver_cannot_login_into_parent_app(): void
    {
        $driver = $this->createDriver([
            'national_id' => '1055443322',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'national_id' => '1055443322',
            'password' => 'secret123',
            'device_name' => 'Driver Phone',
            'app_context' => 'parent', // Trying to enter parent app as driver
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_authenticated_user_can_retrieve_profile_and_logout(): void
    {
        $driver = $this->createDriver();
        Sanctum::actingAs($driver, ['*']);

        // Check user profile
        $userResponse = $this->getJson('/api/auth/user');
        $userResponse->assertStatus(200)
            ->assertJsonPath('data.id', $driver->id);

        // Logout
        $logoutResponse = $this->postJson('/api/auth/logout');
        $logoutResponse->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_user_can_change_password_via_api(): void
    {
        $user = $this->createDriver([
            'password' => bcrypt('old_password_123'),
        ]);
        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/auth/change-password', [
            'current_password' => 'old_password_123',
            'new_password' => 'NewSecretPass123',
            'new_password_confirmation' => 'NewSecretPass123',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $user->refresh();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('NewSecretPass123', $user->password));
    }
}
