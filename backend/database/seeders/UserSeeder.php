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
        // 環境変数から管理者認証情報を取得
        $adminEmail = env('ADMIN_EMAIL', 'admin@example.com');
        $adminPassword = env('ADMIN_PASSWORD');
        $adminName = env('ADMIN_NAME', 'Administrator');

        if (!$adminPassword) {
            $this->command->error('ADMIN_PASSWORD environment variable is required.');
            return;
        }

        // 管理者ユーザーが既に存在する場合はスキップ
        if (User::where('email', $adminEmail)->exists()) {
            $this->command->info('Admin user already exists.');
            return;
        }

        // 管理者ユーザーを作成
        User::create([
            'name' => $adminName,
            'email' => $adminEmail,
            'email_verified_at' => now(),
            'password' => Hash::make($adminPassword),
        ]);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: ' . $adminEmail);
    }
}
