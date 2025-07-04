<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Note: This file is preserved for potential local development.
| Production API routes are handled by Supabase Functions.
| See: /supabase/functions/laravel-api/index.ts
|
*/

// Health check for local development only
if (app()->environment('local')) {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'message' => 'Laravel API is available for local development',
            'note' => 'Production uses Supabase Functions',
            'timestamp' => now()->toISOString(),
            'version' => '1.0.0',
            'laravel_version' => app()->version(),
        ]);
    })->name('health.check');

    Route::get('/debug/info', function () {
        return response()->json([
            'message' => 'Laravel development environment',
            'supabase_functions' => 'Production API at /supabase/functions/laravel-api/',
            'local_api' => 'This endpoint for local dev only',
        ]);
    });
}

// All production API routes are handled by Supabase Functions
// See: /supabase/functions/laravel-api/index.ts