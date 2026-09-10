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

    public function test_services_app_blocks_second_device_and_preserves_first_session(): void
    {
        $driver = $this->createDriver([
            'national_id' => '1199887766',
            'password' => bcrypt('password123'),
        ]);

        // 1. Device A logs in
        $responseA = $this->postJson('/api/auth/login', [
            'national_id' => '1199887766',
            'password' => 'password123',
            'device_name' => 'Device-A-Samsung',
            'app_context' => 'services',
        ]);
        $responseA->assertStatus(200);
        $this->assertEquals(1, $driver->tokens()->count());
        $tokenA = $driver->tokens()->first();
        $this->assertEquals('Device-A-Samsung', $tokenA->name);

        // 2. Device B tries to log in using the same credentials while Device A is still logged in
        $responseB = $this->postJson('/api/auth/login', [
            'national_id' => '1199887766',
            'password' => 'password123',
            'device_name' => 'Device-B-Xiaomi',
            'app_context' => 'services',
        ]);

        // Device B must be rejected with 422 and clear message
        $responseB->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'هذا الحساب مسجل دخول بالفعل على جهاز آخر. يرجى تسجيل الخروج من الجهاز الآخر أولاً لتتمكن من تسجيل الدخول في هذا الجهاز.',
            ]);

        // Device A's token must still exist (first user is NOT kicked out)
        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $tokenA->id,
            'name' => 'Device-A-Samsung',
        ]);
        $this->assertEquals(1, $driver->tokens()->count());
    }
}
