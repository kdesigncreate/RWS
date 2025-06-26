<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 管理者ユーザーが既に存在する場合はスキップ
        if (User::where('email', 'admin@example.com')->exists()) {
            $this->command->info('Admin user already exists.');

            return;
        }

        // 管理者ユーザーを作成
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@example.com');
        $this->command->info('Password: password123');
    }
}
