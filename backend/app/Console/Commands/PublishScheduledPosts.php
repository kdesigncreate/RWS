<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Post;
use Illuminate\Support\Facades\DB;

class PublishScheduledPosts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'posts:publish-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '指定した公開日時になった記事を自動的に公開状態にする';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();
        $count = 0;

        // トランザクションで一括更新
        DB::transaction(function () use ($now, &$count) {
            $posts = Post::where('status', Post::STATUS_PUBLISHED)
                ->whereNotNull('published_at')
                ->where('published_at', '<=', $now)
                ->where(function ($q) {
                    $q->where('is_published', false)->orWhereNull('is_published');
                })
                ->lockForUpdate()
                ->get();

            foreach ($posts as $post) {
                $post->is_published = true;
                $post->save();
                $count++;
            }
        });

        $this->info("公開状態にした記事数: {$count}");
        return 0;
    }
}
