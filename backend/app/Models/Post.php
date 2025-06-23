<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    /**
     * 記事のステータス
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';

    /**
     * 一括代入可能な属性
     *
     * @var array<string>
     */
    protected $fillable = [
        'title',
        'content',
        'excerpt',
        'status',
        'published_at',
        'user_id',
    ];

    /**
     * 属性のキャスト
     *
     * @var array<string, string>
     */
    protected $casts = [
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 公開済み記事のみを取得するスコープ
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)
                    ->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
    }

    /**
     * 下書き記事のみを取得するスコープ
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * 記事の作成者とのリレーション
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 記事が公開されているかどうかを判定
     *
     * @return bool
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED 
            && $this->published_at !== null 
            && $this->published_at->isPast();
    }

    /**
     * 記事が下書きかどうかを判定
     *
     * @return bool
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * 記事を公開状態にする
     *
     * @return void
     */
    public function publish(): void
    {
        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    /**
     * 記事を下書き状態にする
     *
     * @return void
     */
    public function unpublish(): void
    {
        $this->update([
            'status' => self::STATUS_DRAFT,
            'published_at' => null,
        ]);
    }
}
