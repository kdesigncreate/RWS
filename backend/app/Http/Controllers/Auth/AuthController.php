<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * 管理者ログイン
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $user = User::where('Email', $request->email)->first();

            if (! $user || ! Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['メールアドレスまたはパスワードが間違っています。'],
                ]);
            }

            // 既存のトークンを削除（必要に応じて）
            $user->tokens()->delete();

            // 新しいトークンを生成
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful.',
                'user' => new UserResource($user),
                'token' => $token,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Login failed.',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred during login.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 管理者ログアウト
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user) {
                // 現在のアクセストークンを取得
                $currentToken = $user->currentAccessToken();

                if ($currentToken) {
                    // トークンを削除
                    $currentToken->delete();
                }

                // より確実にするため、ユーザーの全てのトークンを削除
                $user->tokens()->delete();
            }

            return response()->json([
                'message' => 'Logout successful.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred during logout.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 現在認証されている管理者情報を取得
     */
    public function user(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'message' => 'User not authenticated.',
                ], 401);
            }

            return response()->json([
                'user' => new UserResource($user),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while fetching user data.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 認証状態の確認
     */
    public function check(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'authenticated' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'authenticated' => true,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * 管理者用: ユーザー一覧を取得（記事作成者選択用）
     */
    public function users(Request $request): JsonResponse
    {
        try {
            $users = User::select('id', 'name', 'Email')
                ->orderBy('name')
                ->get();

            return response()->json([
                'users' => $users,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'ユーザー一覧の取得に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
