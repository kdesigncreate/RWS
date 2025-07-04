<?php

namespace App\Http\Controllers\Post;

use App\Http\Controllers\Controller;
use App\Http\Requests\Post\CreatePostRequest;
use App\Http\Requests\Post\SearchPostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    /**
     * 公開記事一覧を取得
     */
    public function index(SearchPostRequest $request): AnonymousResourceCollection
    {
        $query = Post::published()->with('user')->latest('published_at');

        // 検索機能
        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query->where('title', 'like', '%'.$search.'%')
                    ->orWhere('content', 'like', '%'.$search.'%')
                    ->orWhere('excerpt', 'like', '%'.$search.'%');
            });
        }

        $posts = $query->paginate(
            $request->input('limit', 10),
            ['*'],
            'page',
            $request->input('page', 1)
        );

        return PostResource::collection($posts);
    }

    /**
     * 特定の公開記事を取得
     */
    public function show(int $id): PostResource|JsonResponse
    {
        $post = Post::published()->with('user')->find($id);

        if (! $post) {
            return response()->json([
                'message' => '記事が見つかりません',
            ], 404);
        }

        return new PostResource($post);
    }

    /**
     * 管理者用: 全記事一覧を取得
     */
    public function adminIndex(SearchPostRequest $request): AnonymousResourceCollection
    {
        $query = Post::with('user')->latest();

        // ステータスフィルター
        if ($status = $request->input('status')) {
            if ($status === 'published') {
                $query->published();
            } elseif ($status === 'draft') {
                $query->draft();
            }
        }

        // 検索機能
        if ($search = $request->input('search')) {
            $query->where(function ($query) use ($search) {
                $query->where('title', 'like', '%'.$search.'%')
                    ->orWhere('content', 'like', '%'.$search.'%')
                    ->orWhere('excerpt', 'like', '%'.$search.'%');
            });
        }

        $posts = $query->paginate(
            $request->input('limit', 10),
            ['*'],
            'page',
            $request->input('page', 1)
        );

        return PostResource::collection($posts);
    }

    /**
     * 管理者用: 特定記事を取得（編集用）
     */
    public function adminShow(int $id): PostResource|JsonResponse
    {
        $post = Post::with('user')->find($id);

        if (! $post) {
            return response()->json([
                'message' => '記事が見つかりません',
            ], 404);
        }

        return new PostResource($post);
    }

    /**
     * 管理者用: 新しい記事を作成
     */
    public function store(CreatePostRequest $request): PostResource
    {
        try {
            // user_idが指定されていなければ、認証ユーザーのemailからusersテーブルのidを取得
            $userId = $request->user_id;
            if (!$userId && $request->user()) {
                $user = \App\Models\User::where('Email', $request->user()->email)->first();
                if ($user) {
                    $userId = $user->id;
                }
            }

            $post = Post::create([
                'title' => $request->title,
                'content' => $request->content,
                'excerpt' => $request->excerpt,
                'status' => $request->status ?? Post::STATUS_DRAFT,
                'published_at' => $request->status === Post::STATUS_PUBLISHED ? ($request->published_at ?? now()) : null,
                'user_id' => $userId,
            ]);

            return new PostResource($post->load('user'));
        } catch (\Exception $e) {
            return response()->json([
                'message' => '記事の作成に失敗しました',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 管理者用: 記事を更新
     */
    public function update(UpdatePostRequest $request, int $id): PostResource|JsonResponse
    {
        $post = Post::find($id);

        if (! $post) {
            return response()->json([
                'message' => '記事が見つかりません',
            ], 404);
        }

        // バリデーションはここで実行される
        $validated = $request->validated();

        try {
            $updateData = [
                'title' => $validated['title'],
                'content' => $validated['content'],
                'excerpt' => $validated['excerpt'] ?? null,
                'status' => $validated['status'],
            ];

            // 作成者の変更（指定された場合）
            if (isset($validated['user_id'])) {
                $updateData['user_id'] = $validated['user_id'];
            }

            // ステータスが公開に変更された場合
            if ($validated['status'] === Post::STATUS_PUBLISHED && $post->status !== Post::STATUS_PUBLISHED) {
                $updateData['published_at'] = $validated['published_at'] ?? now();
            }

            // ステータスが下書きに変更された場合
            if ($validated['status'] === Post::STATUS_DRAFT) {
                $updateData['published_at'] = null;
            }

            $post->update($updateData);

            return new PostResource($post->load('user'));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update post.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 管理者用: 記事を削除
     */
    public function destroy(int $id): JsonResponse
    {
        $post = Post::find($id);

        if (! $post) {
            return response()->json([
                'message' => '記事が見つかりません',
            ], 404);
        }

        try {
            $post->delete();

            return response()->json([
                'message' => 'Post deleted successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete post.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
