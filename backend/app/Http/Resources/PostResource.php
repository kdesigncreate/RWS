<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
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
            'title' => $this->title,
            'content' => $this->content,
            'excerpt' => $this->excerpt,
            'status' => $this->status,
            'status_label' => $this->status === 'published' ? '公開' : '下書き',
            'published_at' => $this->published_at?->toISOString(),
            'published_at_formatted' => $this->published_at?->format('Y年m月d日 H:i'),
            'is_published' => $this->isPublished(),
            'is_draft' => $this->isDraft(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'created_at_formatted' => $this->created_at->format('Y年m月d日 H:i'),
            'updated_at_formatted' => $this->updated_at->format('Y年m月d日 H:i'),

            // 作成者情報（リレーションが読み込まれている場合のみ）
            'author' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),

            // 管理者用の追加情報（認証されたユーザーにのみ表示）
            $this->mergeWhen(auth()->check(), [
                'user_id' => $this->user_id,
            ]),

            // メタ情報
            'meta' => [
                'reading_time_minutes' => $this->calculateReadingTime(),
                'content_length' => mb_strlen(strip_tags($this->content)),
            ],

        ];
    }

    /**
     * Customize the response for a request.
     *
     * @param  \Illuminate\Http\JsonResponse  $response
     */
    public function withResponse(Request $request, $response): void
    {
        $response->header('X-Resource-Type', 'PostResource');
    }

    /**
     * 読書時間を計算する（分）
     * 平均的な読書速度を400-500文字/分として計算
     */
    private function calculateReadingTime(): int
    {
        $contentLength = mb_strlen(strip_tags($this->content));
        $wordsPerMinute = 450; // 日本語の平均読書速度

        return max(1, ceil($contentLength / $wordsPerMinute));
    }
}
