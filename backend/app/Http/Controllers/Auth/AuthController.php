<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
     /**
     * 管理者ログイン
     */
    public function login(LoginRequest $request):JsonResponse
    {
        try{
            $user = User::where('email',$request->email)->first();

            if(!$user || !Hash::check($request->password,$user->password)){
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
            // 現在のトークンを削除
            $request->user()->currentAccessToken()->delete();

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

            if (!$user) {
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
    public function check(): JsonResponse
    {
        return response()->json([
            'authenticated' => Auth::guard('sanctum')->check(),
        ]);
    }

}
