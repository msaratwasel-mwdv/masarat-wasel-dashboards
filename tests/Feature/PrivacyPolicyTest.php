<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PrivacyPolicyTest extends TestCase
{
    /**
     * Test that the privacy policy page loads successfully and renders the PrivacyPolicy Inertia view.
     */
    public function test_privacy_policy_page_returns_successful_response(): void
    {
        $response = $this->get('/privacy-policy');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('PrivacyPolicy'));
    }

    /**
     * Test that the shortcut /privacy route redirects directly to /privacy-policy.
     */
    public function test_privacy_shortcut_redirects_to_privacy_policy(): void
    {
        $response = $this->get('/privacy');

        $response->assertRedirect('/privacy-policy');
    }

    /**
     * Test that the XML sitemap contains the privacy policy page.
     */
    public function test_sitemap_includes_privacy_policy_url(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertSee('/privacy-policy');
    }
}
