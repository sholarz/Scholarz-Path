<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Seed baseline subscription plans used by payment flow.
     */
    public function run(): void
    {
        $plans = [
            [
                'code' => 'premium-monthly',
                'name' => 'Premium Monthly',
                'description' => 'Akses premium bulanan untuk fitur ScholarPath.',
                'price' => 99000,
                'currency' => 'IDR',
                'billing_period' => 'monthly',
                'features' => [
                    'Akses konten premium',
                    'Prioritas notifikasi beasiswa',
                    'Forum premium support',
                ],
                'is_active' => true,
            ],
            [
                'code' => 'premium-yearly',
                'name' => 'Premium Yearly',
                'description' => 'Akses premium tahunan dengan harga lebih hemat.',
                'price' => 990000,
                'currency' => 'IDR',
                'billing_period' => 'yearly',
                'features' => [
                    'Akses konten premium',
                    'Prioritas notifikasi beasiswa',
                    'Forum premium support',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::query()->updateOrCreate(
                ['code' => $plan['code']],
                $plan
            );
        }
    }
}
