<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use HasFactory;

    /**
     * 記事のステータス
     */
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';
    
    public const STATUS_ARCHIVED = 'archived'; // Supabaseで追加されたステータス

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
        'slug', // Supabaseで追加されたフィールド
        'featured_image', // Supabaseで追加されたフィールド
        'is_published', // Supabaseで追加されたフィールド
        'is_draft', // Supabaseで追加されたフィールド
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
        'is_published' => 'boolean', // Supabaseで追加されたフィールド
        'is_draft' => 'boolean', // Supabaseで追加されたフィールド
    ];

    /**
     * 公開済み記事のみを取得するスコープ
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * 下書き記事のみを取得するスコープ
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * タイトルまたはコンテンツで記事を検索するスコープ
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($query) use ($search) {
            $query->where('title', 'ILIKE', '%'.$search.'%')
                ->orWhere('content', 'ILIKE', '%'.$search.'%');
        });
    }

    /**
     * 記事の作成者とのリレーション
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 記事が公開されているかどうかを判定
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED
            && $this->published_at !== null
            && $this->published_at->isPast();
    }

    /**
     * 記事が下書きかどうかを判定
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * 記事を公開状態にする
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
     */
    public function unpublish(): void
    {
        $this->update([
            'status' => self::STATUS_DRAFT,
            'published_at' => null,
        ]);
    }
}
