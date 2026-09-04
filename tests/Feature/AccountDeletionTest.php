<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    /**
     * Test that the account deletion page loads successfully and renders the DeleteAccount Inertia view.
     */
    public function test_account_deletion_page_returns_successful_response(): void
    {
        $response = $this->get('/delete-account');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('DeleteAccount'));
    }

    /**
     * Test that the shortcut /delete route redirects directly to /delete-account.
     */
    public function test_delete_shortcut_redirects_to_delete_account(): void
    {
        $response = $this->get('/delete');

        $response->assertRedirect('/delete-account');
    }

    /**
     * Test that the XML sitemap contains the delete account page.
     */
    public function test_sitemap_includes_delete_account_url(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertSee('/delete-account');
    }

    /**
     * Test validation failure when required fields are missing.
     */
    public function test_account_deletion_validation_requires_mandatory_fields(): void
    {
        $response = $this->post('/delete-account', []);

        $response->assertSessionHasErrors(['name', 'phone', 'app_name', 'account_role', 'confirm_understanding']);
    }

    /**
     * Test successful account deletion request submission.
     */
    public function test_account_deletion_request_stores_successfully(): void
    {
        $payload = [
            'name' => 'Ahmed Al-Maamari',
            'phone' => '+968 91234567',
            'email' => 'ahmed@example.com',
            'app_name' => 'خدمات مسارات واصل (Msarat Wasel Services)',
            'account_role' => 'driver',
            'school_name' => 'Muscat Basic School',
            'reason' => 'Finished contract',
            'confirm_understanding' => '1',
        ];

        $response = $this->post('/delete-account', $payload);

        $response->assertRedirect('/delete-account');
        $response->assertSessionHas('status', 'success');
        $response->assertSessionHas('ticket');

        $this->assertDatabaseHas('account_deletion_requests', [
            'name' => 'Ahmed Al-Maamari',
            'phone' => '+968 91234567',
            'app_name' => 'خدمات مسارات واصل (Msarat Wasel Services)',
            'account_role' => 'driver',
            'status' => 'pending',
        ]);
    }
}
