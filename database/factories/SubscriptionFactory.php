<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\School;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subscription>
 */
class SubscriptionFactory extends Factory
{
    protected $model = Subscription::class;

    public function definition(): array
    {
        return [
            'plan_id' => Plan::factory(),
            'school_id' => School::factory(),
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'final_price' => 1200.00,
            'grace_period_ends_at' => null,
            'notes' => null,
        ];
    }

    public function pendingApproval(): static
    {
        return $this->state(fn () => [
            'status' => 'pending_approval',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => 'expired',
            'start_date' => now()->subYear()->toDateString(),
            'end_date' => now()->subMonth()->toDateString(),
        ]);
    }
}
