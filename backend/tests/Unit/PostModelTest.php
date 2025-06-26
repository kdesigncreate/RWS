<?php

namespace Tests\Unit;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    /**
     * 記事が正常に作成できるテスト
     */
    public function test_post_can_be_created(): void
    {
        $postData = [
            'title' => 'Test Post Title',
            'content' => 'Test post content.',
            'status' => 'published',
            'user_id' => $this->user->id,
        ];

        $post = Post::create($postData);

        $this->assertInstanceOf(Post::class, $post);
        $this->assertEquals($postData['title'], $post->title);
        $this->assertEquals($postData['content'], $post->content);
        $this->assertEquals($postData['status'], $post->status);
        $this->assertEquals($postData['user_id'], $post->user_id);
        $this->assertNotNull($post->id);
        $this->assertNotNull($post->created_at);
        $this->assertNotNull($post->updated_at);
    }

    /**
     * 記事とユーザーのリレーションテスト
     */
    public function test_post_belongs_to_user(): void
    {
        $post = Post::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $this->assertInstanceOf(User::class, $post->user);
        $this->assertEquals($this->user->id, $post->user->id);
        $this->assertEquals($this->user->name, $post->user->name);
    }

    /**
     * ユーザーが複数の記事を持てるテスト
     */
    public function test_user_can_have_multiple_posts(): void
    {
        $posts = Post::factory()->count(3)->create([
            'user_id' => $this->user->id,
        ]);

        $userPosts = $this->user->posts;

        $this->assertCount(3, $userPosts);
        $this->assertInstanceOf(Post::class, $userPosts->first());
    }

    /**
     * 公開記事のスコープテスト
     */
    public function test_published_scope_returns_only_published_posts(): void
    {
        // 公開記事を作成
        Post::factory()->count(2)->published()->create([
            'user_id' => $this->user->id,
        ]);

        // 下書き記事を作成
        Post::factory()->count(3)->draft()->create([
            'user_id' => $this->user->id,
        ]);

        $publishedPosts = Post::published()->get();

        $this->assertCount(2, $publishedPosts);
        foreach ($publishedPosts as $post) {
            $this->assertEquals('published', $post->status);
        }
    }

    /**
     * 下書き記事のスコープテスト
     */
    public function test_draft_scope_returns_only_draft_posts(): void
    {
        // 公開記事を作成
        Post::factory()->count(2)->published()->create([
            'user_id' => $this->user->id,
        ]);

        // 下書き記事を作成
        Post::factory()->count(3)->draft()->create([
            'user_id' => $this->user->id,
        ]);

        $draftPosts = Post::draft()->get();

        $this->assertCount(3, $draftPosts);
        foreach ($draftPosts as $post) {
            $this->assertEquals('draft', $post->status);
        }
    }

    /**
     * 記事検索スコープテスト
     */
    public function test_search_scope_finds_posts_by_title_and_content(): void
    {
        // 検索対象記事を作成
        Post::factory()->published()->create([
            'user_id' => $this->user->id,
            'title' => 'Laravel Programming Guide',
            'content' => 'This is about Laravel framework.',
        ]);

        Post::factory()->published()->create([
            'user_id' => $this->user->id,
            'title' => 'PHP Best Practices',
            'content' => 'Laravel is a popular PHP framework.',
        ]);

        // 検索対象外記事を作成
        Post::factory()->published()->create([
            'user_id' => $this->user->id,
            'title' => 'JavaScript Tutorial',
            'content' => 'This is about JavaScript programming.',
        ]);

        // タイトルで検索
        $results = Post::search('Laravel')->get();
        $this->assertCount(2, $results);

        // コンテンツで検索
        $results = Post::search('framework')->get();
        $this->assertCount(2, $results);

        // 存在しないキーワードで検索
        $results = Post::search('Python')->get();
        $this->assertCount(0, $results);
    }

    /**
     * 記事のソート機能テスト
     */
    public function test_posts_can_be_sorted_by_latest(): void
    {
        // 異なる時間で記事を作成
        $oldPost = Post::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDays(2),
        ]);

        $newPost = Post::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDay(),
        ]);

        $latestPost = Post::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now(),
        ]);

        $sortedPosts = Post::latest()->get();

        $this->assertEquals($latestPost->id, $sortedPosts->first()->id);
        $this->assertEquals($oldPost->id, $sortedPosts->last()->id);
    }

    /**
     * 記事の必須フィールドテスト
     */
    public function test_post_requires_title_and_content(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        // タイトルなしで記事作成を試行
        Post::create([
            'content' => 'Content without title',
            'status' => 'published',
            'user_id' => $this->user->id,
        ]);
    }

    /**
     * 記事のステータス検証テスト
     */
    public function test_post_status_validation(): void
    {
        $post = Post::factory()->make([
            'user_id' => $this->user->id,
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->assertTrue($post->isPublished());
        $this->assertFalse($post->isDraft());

        $post->status = 'draft';
        $post->published_at = null;

        $this->assertFalse($post->isPublished());
        $this->assertTrue($post->isDraft());
    }

    /**
     * 記事の文字数制限テスト
     */
    public function test_post_title_length_validation(): void
    {
        // 255文字を超えるタイトル
        $longTitle = str_repeat('a', 256);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Post::create([
            'title' => $longTitle,
            'content' => 'Test content',
            'status' => 'published',
            'user_id' => $this->user->id,
        ]);
    }

    /**
     * 記事の日付フォーマットテスト
     */
    public function test_post_date_formatting(): void
    {
        $post = Post::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $post->created_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $post->updated_at);

        // 日付フォーマットのテスト（カスタムアクセサがある場合）
        $this->assertIsString($post->created_at->toDateString());
        $this->assertIsString($post->updated_at->toDateString());
    }

    /**
     * 記事の配列変換テスト
     */
    public function test_post_to_array_conversion(): void
    {
        $post = Post::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $postArray = $post->toArray();

        $this->assertIsArray($postArray);
        $this->assertArrayHasKey('id', $postArray);
        $this->assertArrayHasKey('title', $postArray);
        $this->assertArrayHasKey('content', $postArray);
        $this->assertArrayHasKey('status', $postArray);
        $this->assertArrayHasKey('user_id', $postArray);
        $this->assertArrayHasKey('created_at', $postArray);
        $this->assertArrayHasKey('updated_at', $postArray);
    }

    /**
     * 記事の公開機能テスト
     */
    public function test_post_can_be_published(): void
    {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->user->id,
            'published_at' => null,
        ]);

        $this->assertTrue($post->isDraft());
        $this->assertFalse($post->isPublished());

        $post->publish();

        $this->assertTrue($post->isPublished());
        $this->assertFalse($post->isDraft());
        $this->assertNotNull($post->published_at);
        $this->assertEquals(Post::STATUS_PUBLISHED, $post->status);
    }

    /**
     * 記事の非公開機能テスト
     */
    public function test_post_can_be_unpublished(): void
    {
        $post = Post::factory()->published()->create([
            'user_id' => $this->user->id,
            'published_at' => now(),
        ]);

        $this->assertTrue($post->isPublished());
        $this->assertFalse($post->isDraft());

        $post->unpublish();

        $this->assertTrue($post->isDraft());
        $this->assertFalse($post->isPublished());
        $this->assertNull($post->published_at);
        $this->assertEquals(Post::STATUS_DRAFT, $post->status);
    }

    /**
     * 既に公開済みの記事を再度公開しても問題ないテスト
     */
    public function test_already_published_post_can_be_published_again(): void
    {
        $originalPublishedAt = now()->subDay();
        $post = Post::factory()->published()->create([
            'user_id' => $this->user->id,
            'published_at' => $originalPublishedAt,
        ]);

        $this->assertTrue($post->isPublished());

        $post->publish();

        $this->assertTrue($post->isPublished());
        $this->assertEquals(Post::STATUS_PUBLISHED, $post->status);
        // published_atは更新される
        $this->assertNotEquals($originalPublishedAt, $post->published_at);
    }

    /**
     * 既に下書きの記事を再度非公開にしても問題ないテスト
     */
    public function test_already_draft_post_can_be_unpublished_again(): void
    {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->user->id,
            'published_at' => null,
        ]);

        $this->assertTrue($post->isDraft());

        $post->unpublish();

        $this->assertTrue($post->isDraft());
        $this->assertEquals(Post::STATUS_DRAFT, $post->status);
        $this->assertNull($post->published_at);
    }

    /**
     * ユーザーの公開記事リレーションテスト
     */
    public function test_user_published_posts_relationship(): void
    {
        // 公開記事を作成
        Post::factory()->count(3)->published()->create([
            'user_id' => $this->user->id,
        ]);

        // 下書き記事を作成
        Post::factory()->count(2)->draft()->create([
            'user_id' => $this->user->id,
        ]);

        $publishedPosts = $this->user->publishedPosts;

        $this->assertCount(3, $publishedPosts);
        foreach ($publishedPosts as $post) {
            $this->assertEquals(Post::STATUS_PUBLISHED, $post->status);
            $this->assertEquals($this->user->id, $post->user_id);
        }
    }

    /**
     * ユーザーの下書き記事リレーションテスト
     */
    public function test_user_draft_posts_relationship(): void
    {
        // 公開記事を作成
        Post::factory()->count(2)->published()->create([
            'user_id' => $this->user->id,
        ]);

        // 下書き記事を作成
        Post::factory()->count(4)->draft()->create([
            'user_id' => $this->user->id,
        ]);

        $draftPosts = $this->user->draftPosts;

        $this->assertCount(4, $draftPosts);
        foreach ($draftPosts as $post) {
            $this->assertEquals(Post::STATUS_DRAFT, $post->status);
            $this->assertEquals($this->user->id, $post->user_id);
        }
    }

    /**
     * ユーザーの最新記事リレーションテスト
     */
    public function test_user_latest_posts_relationship(): void
    {
        // 複数の記事を作成（作成日時を異なる時間に設定）
        $oldPost = Post::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDays(3),
        ]);

        $middlePost = Post::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subDays(1),
        ]);

        $newPost = Post::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now(),
        ]);

        $latestPosts = $this->user->latestPosts;

        $this->assertCount(3, $latestPosts);
        // 最新の記事が最初に来ることを確認
        $this->assertEquals($newPost->id, $latestPosts->first()->id);
        $this->assertEquals($oldPost->id, $latestPosts->last()->id);
    }

    /**
     * ユーザーの最新記事リレーション（5件制限）テスト
     */
    public function test_user_latest_posts_relationship_limit(): void
    {
        // 6件の記事を作成
        Post::factory()->count(6)->create([
            'user_id' => $this->user->id,
        ]);

        $latestPosts = $this->user->latestPosts;

        // 5件までしか取得されないことを確認
        $this->assertCount(5, $latestPosts);
    }
}
