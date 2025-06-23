<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// API専用プロジェクト用のログインルート（リダイレクト用）
Route::get('/login', function () {
    return response()->json([
        'message' => 'Unauthenticated. Please login via API.',
        'login_endpoint' => url('api/login'),
    ], 401);
})->name('login');