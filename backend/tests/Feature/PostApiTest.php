<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        // テスト用管理者ユーザーを作成
        $this->adminUser = User::factory()->create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // テスト用記事を作成
        $this->publishedPosts = Post::factory()->count(3)->published()->create([
            'user_id' => $this->adminUser->id,
        ]);

        $this->draftPosts = Post::factory()->count(2)->draft()->create([
            'user_id' => $this->adminUser->id,
        ]);
    }

    // ======================
    // 公開側API（認証不要）のテスト
    // ======================

    /**
     * 公開記事一覧取得テスト
     */
    public function test_can_get_published_posts_list(): void
    {
        $response = $this->getJson('/api/posts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'content',
                        'status',
                        'created_at',
                        'updated_at',
                        'author' => [
                            'id',
                            'name',
                        ],
                    ],
                ],
                'meta' => [
                    'current_page',
                    'total',
                    'per_page',
                ],
            ]);

        // 公開記事のみが返されることを確認
        $responseData = $response->json('data');
        $this->assertCount(3, $responseData);

        foreach ($responseData as $post) {
            $this->assertEquals('published', $post['status']);
        }
    }

    /**
     * 公開記事詳細取得テスト
     */
    public function test_can_get_published_post_detail(): void
    {
        $post = $this->publishedPosts->first();

        $response = $this->getJson("/api/posts/{$post->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'content',
                    'status',
                    'created_at',
                    'updated_at',
                    'author' => [
                        'id',
                        'name',
                    ],
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'status' => 'published',
                ],
            ]);
    }

    /**
     * 非公開記事は公開側で取得できないテスト
     */
    public function test_cannot_get_draft_post_from_public_api(): void
    {
        $draftPost = $this->draftPosts->first();

        $response = $this->getJson("/api/posts/{$draftPost->id}");

        $response->assertStatus(404);
    }

    /**
     * 記事検索機能テスト
     */
    public function test_can_search_published_posts(): void
    {
        // 検索用の記事を作成
        $searchPost = Post::factory()->published()->create([
            'user_id' => $this->adminUser->id,
            'title' => 'Laravel テスト記事',
            'content' => 'この記事はLaravelのテストについて説明します。',
        ]);

        // タイトルで検索
        $response = $this->getJson('/api/posts?search=Laravel');

        $response->assertStatus(200);
        $responseData = $response->json('data');

        $this->assertGreaterThanOrEqual(1, count($responseData));
        $found = false;
        foreach ($responseData as $post) {
            if ($post['id'] === $searchPost->id) {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, 'Search post should be found in results');
    }

    /**
     * ページネーション機能テスト
     */
    public function test_posts_pagination_works(): void
    {
        // 追加の記事を作成（合計で10記事以上にする）
        Post::factory()->count(10)->create([
            'user_id' => $this->adminUser->id,
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/posts?page=1&limit=5');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'total',
                    'per_page',
                    'last_page',
                ],
            ]);

        $meta = $response->json('meta');
        $this->assertEquals(1, $meta['current_page']);
        $this->assertEquals(5, $meta['per_page']);
        $this->assertGreaterThanOrEqual(5, count($response->json('data')));
    }

    // ======================
    // 管理者側API（認証必須）のテスト
    // ======================

    /**
     * 管理者は全記事一覧を取得できるテスト
     */
    public function test_admin_can_get_all_posts(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/admin/posts');

        $response->assertStatus(200);
        $responseData = $response->json('data');

        // 公開・非公開合わせて5記事すべてが返されることを確認
        $this->assertEquals(5, count($responseData));
    }

    /**
     * 管理者記事作成テスト
     */
    public function test_admin_can_create_post(): void
    {
        Sanctum::actingAs($this->adminUser);

        $postData = [
            'title' => 'New Test Post',
            'content' => 'This is a test post content.',
            'status' => 'published',
        ];

        $response = $this->postJson('/api/admin/posts', $postData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'content',
                    'status',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'data' => [
                    'title' => $postData['title'],
                    'content' => $postData['content'],
                    'status' => $postData['status'],
                ],
            ]);

        // データベースに保存されているかテスト
        $this->assertDatabaseHas('posts', [
            'title' => $postData['title'],
            'content' => $postData['content'],
            'status' => $postData['status'],
            'user_id' => $this->adminUser->id,
        ]);
    }

    /**
     * 記事作成バリデーションテスト
     */
    public function test_post_creation_validation(): void
    {
        Sanctum::actingAs($this->adminUser);

        // タイトルなし
        $response = $this->postJson('/api/admin/posts', [
            'content' => 'Content without title',
            'status' => 'published',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title']);

        // コンテンツなし
        $response = $this->postJson('/api/admin/posts', [
            'title' => 'Title without content',
            'status' => 'published',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content']);

        // 無効なステータス
        $response = $this->postJson('/api/admin/posts', [
            'title' => 'Test Title',
            'content' => 'Test Content',
            'status' => 'invalid_status',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * 管理者記事更新テスト
     */
    public function test_admin_can_update_post(): void
    {
        Sanctum::actingAs($this->adminUser);

        $post = $this->publishedPosts->first();
        $updateData = [
            'title' => 'Updated Title',
            'content' => 'Updated content.',
            'status' => 'draft',
        ];

        $response = $this->putJson("/api/admin/posts/{$post->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $post->id,
                    'title' => $updateData['title'],
                    'content' => $updateData['content'],
                    'status' => $updateData['status'],
                ],
            ]);

        // データベースが更新されているかテスト
        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'title' => $updateData['title'],
            'content' => $updateData['content'],
            'status' => $updateData['status'],
        ]);
    }

    /**
     * 管理者記事削除テスト
     */
    public function test_admin_can_delete_post(): void
    {
        Sanctum::actingAs($this->adminUser);

        $post = $this->publishedPosts->first();

        $response = $this->deleteJson("/api/admin/posts/{$post->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Post deleted successfully.',
            ]);

        // データベースから削除されているかテスト
        $this->assertDatabaseMissing('posts', [
            'id' => $post->id,
        ]);
    }

    /**
     * 存在しない記事の操作テスト
     */
    public function test_admin_cannot_operate_non_existent_post(): void
    {
        Sanctum::actingAs($this->adminUser);

        $nonExistentId = 99999;

        // 取得
        $response = $this->getJson("/api/admin/posts/{$nonExistentId}");
        $response->assertStatus(404);

        // 更新
        $response = $this->putJson("/api/admin/posts/{$nonExistentId}", [
            'title' => 'Updated Title',
            'content' => 'Updated content',
            'status' => 'draft',
        ]);
        $response->assertStatus(404);

        // 削除
        $response = $this->deleteJson("/api/admin/posts/{$nonExistentId}");
        $response->assertStatus(404);
    }

    /**
     * 未認証ユーザーは管理者APIにアクセスできないテスト
     */
    public function test_unauthenticated_user_cannot_access_admin_apis(): void
    {
        // 記事一覧取得
        $response = $this->getJson('/api/admin/posts');
        $response->assertStatus(401);

        // 記事作成
        $response = $this->postJson('/api/admin/posts', [
            'title' => 'Test Title',
            'content' => 'Test Content',
            'status' => 'published',
        ]);
        $response->assertStatus(401);

        // 記事更新
        $post = $this->publishedPosts->first();
        $response = $this->putJson("/api/admin/posts/{$post->id}", [
            'title' => 'Updated Title',
        ]);
        $response->assertStatus(401);

        // 記事削除
        $response = $this->deleteJson("/api/admin/posts/{$post->id}");
        $response->assertStatus(401);
    }

    /**
     * 管理者が記事をステータスでフィルタリングできるかテスト
     */
    public function test_admin_can_filter_posts_by_status(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 既存のデータをクリア
        Post::where('user_id', $this->adminUser->id)->delete();

        // 公開記事と下書き記事を作成
        Post::factory()->count(3)->published()->create(['user_id' => $this->adminUser->id]);
        Post::factory()->count(2)->draft()->create(['user_id' => $this->adminUser->id]);

        // 公開記事のみを取得
        $response = $this->getJson('/api/admin/posts?status=published');

        $response->assertStatus(200);
        $posts = $response->json('data');
        $this->assertCount(3, $posts);
        foreach ($posts as $post) {
            $this->assertEquals('published', $post['status']);
        }

        // 下書き記事のみを取得
        $response = $this->getJson('/api/admin/posts?status=draft');

        $response->assertStatus(200);
        $posts = $response->json('data');
        $this->assertCount(2, $posts);
        foreach ($posts as $post) {
            $this->assertEquals('draft', $post['status']);
        }
    }

    /**
     * バリデーションエラーハンドリングのテスト
     */
    public function test_validation_error_handling(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 必須フィールドが不足している場合
        $response = $this->postJson('/api/admin/posts', [
            'title' => '', // 空のタイトル
            'content' => '', // 空のコンテンツ
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'content']);

        // 無効なステータス
        $response = $this->postJson('/api/admin/posts', [
            'title' => 'Test Post',
            'content' => 'Test content',
            'status' => 'invalid_status',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * 認証エラーハンドリングのテスト
     */
    public function test_authorization_error_handling(): void
    {
        // 認証なしで管理者専用エンドポイントにアクセス
        $response = $this->getJson('/api/admin/posts');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);

        // 認証なしで記事作成を試行
        $response = $this->postJson('/api/admin/posts', [
            'title' => 'Test Post',
            'content' => 'Test content',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * 存在しないリソースへのアクセステスト
     */
    public function test_not_found_error_handling(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 存在しない記事IDでアクセス
        $response = $this->getJson('/api/admin/posts/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => '記事が見つかりません',
            ]);

        // 存在しない記事を更新しようとする
        $response = $this->putJson('/api/admin/posts/99999', [
            'title' => 'Updated Title',
            'content' => 'Updated content',
            'status' => 'draft',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => '記事が見つかりません',
            ]);

        // 存在しない記事を削除しようとする
        $response = $this->deleteJson('/api/admin/posts/99999');

        $response->assertStatus(404)
            ->assertJson([
                'message' => '記事が見つかりません',
            ]);
    }
}
