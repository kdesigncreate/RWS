<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Post\PostController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API全体にstateful設定を適用
Route::middleware(['ensure.api.stateful'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | 認証API (Auth)
    |--------------------------------------------------------------------------
    */

    // 管理者ログイン（認証不要）
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');

    // 認証が必要なルート
    Route::middleware(['auth:sanctum'])->group(function () {
        // 管理者ログアウト
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');

        // 現在認証されている管理者情報の取得
        Route::get('/user', [AuthController::class, 'user'])->name('auth.user');

        // 認証状態の確認
        Route::get('/auth/check', [AuthController::class, 'check'])->name('auth.check');
    });

    /*
    |--------------------------------------------------------------------------
    | 公開記事API (認証不要)
    |--------------------------------------------------------------------------
    */

    Route::prefix('posts')->name('posts.')->group(function () {
        // 公開されている記事の一覧取得
        Route::get('/', [PostController::class, 'index'])->name('index');

        // 特定の公開記事の詳細取得
        Route::get('/{id}', [PostController::class, 'show'])
            ->where('id', '[0-9]+')
            ->name('show');
    });

    /*
    |--------------------------------------------------------------------------
    | 管理者記事API (認証必須)
    |--------------------------------------------------------------------------
    */

    Route::middleware(['auth:sanctum'])->prefix('admin')->name('admin.')->group(function () {

        Route::prefix('posts')->name('posts.')->group(function () {
            // 全ての記事の一覧取得
            Route::get('/', [PostController::class, 'adminIndex'])->name('index');

            // 新しい記事の作成
            Route::post('/', [PostController::class, 'store'])->name('store');

            // 特定の記事の詳細取得（編集画面用）
            Route::get('/{id}', [PostController::class, 'adminShow'])
                ->where('id', '[0-9]+')
                ->name('show');

            // 特定の記事の更新
            Route::put('/{id}', [PostController::class, 'update'])
                ->where('id', '[0-9]+')
                ->name('update');

            // 特定の記事の削除
            Route::delete('/{id}', [PostController::class, 'destroy'])
                ->where('id', '[0-9]+')
                ->name('destroy');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | ヘルスチェック・デバッグ用API
    |--------------------------------------------------------------------------
    */

    // APIの動作確認用
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
            'version' => '1.0.0',
            'laravel_version' => app()->version(),
        ]);
    })->name('health.check');

    // 開発環境でのみ有効なデバッグ情報
    if (app()->environment('local')) {
        Route::get('/debug/routes', function () {
            $routes = [];
            foreach (Route::getRoutes() as $route) {
                if (str_starts_with($route->uri(), 'api/')) {
                    $routes[] = [
                        'method' => implode('|', $route->methods()),
                        'uri' => $route->uri(),
                        'name' => $route->getName(),
                        'action' => $route->getActionName(),
                    ];
                }
            }

            return response()->json($routes);
        })->name('debug.routes');
    }

    // CORS テスト用エンドポイント
    Route::get('/cors-test', function () {
        return response()->json([
            'message' => 'CORS is working!',
            'origin' => request()->header('Origin'),
            'user_agent' => request()->header('User-Agent'),
            'timestamp' => now()->toISOString(),
        ]);
    })->name('cors.test');

    Route::post('/cors-test', function () {
        return response()->json([
            'message' => 'POST request successful!',
            'data' => request()->all(),
            'timestamp' => now()->toISOString(),
        ]);
    })->name('cors.test.post');

});
