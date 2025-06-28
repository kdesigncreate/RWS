<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class UpdateAdminPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:update-password {email} {password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update admin user password with WebCrypto compatible hash';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $password = $this->argument('password');

        $this->info("=== Admin Password Update ===");
        $this->info("Email: {$email}");
        
        // Generate WebCrypto compatible hash
        $hashedPassword = Hash::make($password, ['rounds' => 12]);
        
        $this->info("Generated hash: {$hashedPassword}");
        $this->info("Hash verification: " . (Hash::check($password, $hashedPassword) ? 'PASS' : 'FAIL'));

        try {
            // Check if user exists
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Create new admin user
                $this->info("Creating new admin user...");
                $user = User::create([
                    'name' => 'Administrator',
                    'email' => $email,
                    'password' => $hashedPassword,
                    'role' => 'admin',
                    'email_verified_at' => now(),
                ]);
                $this->info("Admin user created with ID: {$user->id}");
            } else {
                // Update existing user
                $this->info("Updating existing admin user...");
                $user->update([
                    'password' => $hashedPassword,
                ]);
                $this->info("Admin password updated successfully!");
            }

            // Verify the update
            $user->refresh();
            if (Hash::check($password, $user->password)) {
                $this->info("Password verification: SUCCESS");
                $this->info("\n=== SUCCESS ===");
                $this->info("Admin password has been updated successfully!");
                $this->info("You can now login with:");
                $this->info("Email: {$email}");
                $this->info("Password: {$password}");
                return 0;
            } else {
                $this->error("Password verification: FAILED");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            return 1;
        }
    }
}