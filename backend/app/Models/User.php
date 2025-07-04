<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * User Model
 * 
 * Note: This model is preserved for potential local development.
 * Production authentication is handled by Supabase Auth.
 * See: /supabase/functions/laravel-api/index.ts
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Note: Production uses Supabase Auth for all operations
    // This model is kept for local development compatibility only

    protected $fillable = [
        'name',
        'Email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}