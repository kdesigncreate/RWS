<?php

namespace App\Http\Controllers\Post;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Http\Requests\Post\CreatePostRequest;
use App\Http\Requests\Post\UpdatePostRequest;
use App\Http\Requests\Post\SearchPostRequest;
use App\Http\Resources\PostResource;
use Illuminate\Http\Request;
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
        if($search = $request->input('search')){
            $query->where(function($query) use ($search){
                $query->where('title','like','%'.$search.'%')   
                ->orWhere('content','like','%'.$search.'%')
                ->orWhere('excerpt','like','%'.$search.'%');
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

        if(!$post){
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
        if($status = $request->input('status')){
            if($status === 'published'){
                $query->published();
            }elseif($status === 'draft'){
                $query->draft();
            }
        }

        // 検索機能
        if($search = $request->input('search')){
            $query->where(function($query) use ($search){
                $query->where('title','like','%'.$search.'%')
                ->orWhere('content','like','%'.$search.'%')
                ->orWhere('excerpt','like','%'.$search.'%');
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

        if(!$post){
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
        try{
            $post = Post::create([
                'title' => $request->title,
                'content' => $request->content,
                'excerpt' => $request->excerpt,
                'status' => $request->status ?? Post::STATUS_DRAFT,
                'published_at' => $request->status === Post::STATUS_PUBLISHED ? ($request->published_at ?? now()) : null,
                'user_id' => auth()->id(),
            ]);

            return new PostResource($post->load('user'));
        }catch(\Exception $e){
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

        if (!$post) {
            return response()->json([
                'message' => 'Record not found.'
            ], 404);
        }

        try {
            $updateData = [
                'title' => $request->title,
                'content' => $request->content,
                'excerpt' => $request->excerpt,
                'status' => $request->status,
            ];

            // ステータスが公開に変更された場合
            if ($request->status === Post::STATUS_PUBLISHED && $post->status !== Post::STATUS_PUBLISHED) {
                $updateData['published_at'] = $request->published_at ?? now();
            }

            // ステータスが下書きに変更された場合
            if ($request->status === Post::STATUS_DRAFT) {
                $updateData['published_at'] = null;
            }

            $post->update($updateData);

            return new PostResource($post->load('user'));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update post.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 管理者用: 記事を削除
     */
    public function destroy(int $id): JsonResponse
    {
        $post = Post::find($id);

        if (!$post) {
            return response()->json([
                'message' => 'Record not found.'
            ], 404);
        }

        try {
            $post->delete();

            return response()->json([
                'message' => 'Post deleted successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete post.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
