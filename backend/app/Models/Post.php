<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Post Model
 * 
 * Note: This model is preserved for potential local development.
 * Production operations are handled by Supabase Functions.
 * See: /supabase/functions/laravel-api/index.ts
 */
class Post extends Model
{
    use HasFactory;

    // Note: Production uses Supabase Functions for all operations
    // This model is kept for local development compatibility only
    
    protected $fillable = [
        'title',
        'content', 
        'excerpt',
        'status',
        'published_at',
        'user_id'
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    // Status constants for compatibility
    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
}