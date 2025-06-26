<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,

            // メール確認状態
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'is_email_verified' => ! is_null($this->email_verified_at),

            // アカウント作成日時
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'created_at_formatted' => $this->created_at->format('Y年m月d日'),
            'updated_at_formatted' => $this->updated_at->format('Y年m月d日'),

            // アカウント情報
            'account_age_days' => $this->created_at->diffInDays(now()),

            // 投稿統計（記事との関連が読み込まれている場合）
            'posts_count' => $this->whenCounted('posts'),
            'published_posts_count' => $this->whenCounted('publishedPosts'),
            'draft_posts_count' => $this->whenCounted('draftPosts'),

            // 最新の投稿（リレーションが読み込まれている場合）
            'latest_posts' => PostResource::collection($this->whenLoaded('latestPosts')),

            // プロフィール情報（認証されたユーザー自身の情報の場合のみ）
            $this->mergeWhen(auth()->id() === $this->id, [
                'profile' => [
                    'timezone' => config('app.timezone'),
                    'locale' => app()->getLocale(),
                ],
            ]),
        ];
    }

    /**
     * Additional data to be added to the resource array.
     */
    public function with(Request $request): array
    {
        return [
            'version' => '1.0',
            'api_endpoint' => $request->url(),
        ];
    }

    /**
     * Customize the response for a request.
     *
     * @param  \Illuminate\Http\JsonResponse  $response
     */
    public function withResponse(Request $request, $response): void
    {
        $response->header('X-Resource-Type', 'UserResource');
    }
}
