<?php

namespace Database\Factories;

use App\Models\Installment;
use App\Models\School;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Installment>
 */
class InstallmentFactory extends Factory
{
    protected $model = Installment::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'subscription_id' => Subscription::factory(),
            'installment_number' => 1,
            'amount' => 500.00,
            'paid_amount' => 0.00,
            'due_date' => now()->addMonth()->toDateString(),
            'status' => 'pending',
            'receipt_path' => null,
            'verification_status' => 'pending',
            'admin_note' => null,
        ];
    }
}
