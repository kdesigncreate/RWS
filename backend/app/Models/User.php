<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * 投稿記事とのリレーション
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * 公開済み記事とのリレーション
     */
    public function publishedPosts()
    {
        return $this->hasMany(Post::class)->where('status', Post::STATUS_PUBLISHED);
    }

    /**
     * 下書き記事とのリレーション
     */
    public function draftPosts()
    {
        return $this->hasMany(Post::class)->where('status', Post::STATUS_DRAFT);
    }

    /**
     * 最新の投稿記事とのリレーション
     */
    public function latestPosts()
    {
        return $this->hasMany(Post::class)->latest()->limit(5);
    }
}