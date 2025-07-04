import { test, expect, Page } from "@playwright/test";

// テスト用の認証情報
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";

// ページURL
const LOGIN_URL = "/admin";
const DASHBOARD_URL = "/admin/dashboard";
const HOME_URL = "/";

// テスト用データ
const TEST_POST = {
  title: "E2Eテスト記事",
  content:
    "これはE2Eテスト用の記事コンテンツです。Playwrightを使用してテストしています。",
};

const UPDATED_POST = {
  title: "E2Eテスト記事（更新版）",
  content: "これは更新されたE2Eテスト用の記事コンテンツです。",
};

/**
 * 管理者ログインのヘルパー関数
 */
async function loginAsAdmin(page: Page) {
  await page.goto(LOGIN_URL);
  await page.fill('input[id="email"]', ADMIN_EMAIL);
  await page.fill('input[id="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(DASHBOARD_URL);
}

/**
 * 記事作成のヘルパー関数
 */
async function createTestPost(page: Page, postData = TEST_POST) {
  await page.click('button:has-text("新規作成")');
  await page.fill('input[name="title"]', postData.title);
  await page.fill('textarea[name="content"]', postData.content);
  await page.click('button[type="submit"]:has-text("保存")');
}

test.describe("Posts Management E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にlocalStorageをクリア
    await page.goto(HOME_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Public Posts Display", () => {
    /**
     * トップページの記事一覧表示テスト
     */
    test("should display published posts on home page", async ({ page }) => {
      await page.goto(HOME_URL);

      // ページタイトルの確認
      await expect(page).toHaveTitle(/R\.W\.S/);

      // News セクションの表示確認
      await expect(page.locator('h2:has-text("News")')).toBeVisible();

      // 記事リストまたは「まだ投稿がありません」メッセージの確認
      const postSection = page.locator('section:has-text("News")');
      await expect(postSection).toBeVisible();

      // 記事カードが存在する場合の要素確認
      const postCards = page.locator(".post-card");
      const cardCount = await postCards.count();

      if (cardCount > 0) {
        const firstPost = postCards.first();
        await expect(firstPost.locator(".post-title")).toBeVisible();
        await expect(firstPost.locator(".post-content")).toBeVisible();
        await expect(firstPost.locator(".post-author")).toBeVisible();
        await expect(firstPost.locator(".post-date")).toBeVisible();
      }
    });

    /**
     * 記事詳細ページテスト
     */
    test("should display post detail page correctly", async ({ page }) => {
      await page.goto(HOME_URL);

      // 記事カードが存在するかチェック
      const postCards = page.locator(".post-card");
      const cardCount = await postCards.count();

      if (cardCount > 0) {
        // 記事一覧から最初の記事をクリック
        const firstPost = postCards.first();
        const postTitle = await firstPost.locator(".post-title").textContent();

        await firstPost.click();

        // 記事詳細ページに遷移することを確認
        await expect(page.url()).toMatch(/\/info\/\d+/);

        // 記事詳細の表示確認
        await expect(page.locator("h1")).toContainText(postTitle || "");
        await expect(page.locator(".post-content")).toBeVisible();
        await expect(page.locator(".post-meta")).toBeVisible();

        // 戻るボタンの確認
        await expect(page.locator('button:has-text("戻る")')).toBeVisible();
      } else {
        // 記事が存在しない場合はテストをスキップ
        console.log("No posts available for detail page test");
      }
    });

    /**
     * 記事検索機能テスト
     */
    test("should search posts correctly", async ({ page }) => {
      await page.goto(HOME_URL);

      // 検索ボックスに入力
      const searchBox = page.locator('input[placeholder*="検索"]');
      await searchBox.fill("Laravel");
      await page.keyboard.press("Enter");

      // 検索結果の確認
      await page.waitForTimeout(1000); // 検索処理待機

      const searchResults = page.locator(".post-card");
      const resultCount = await searchResults.count();

      if (resultCount > 0) {
        // 検索結果に「Laravel」が含まれていることを確認
        const firstResult = searchResults.first();
        const resultText = await firstResult.textContent();
        expect(resultText?.toLowerCase()).toContain("laravel");
      }
    });

    /**
     * ページネーション機能テスト
     */
    test("should handle pagination correctly", async ({ page }) => {
      await page.goto(HOME_URL);

      // ページネーションが表示されている場合のテスト
      const pagination = page.locator(".pagination");
      if (await pagination.isVisible()) {
        const nextButton = page.locator('button:has-text("次へ")');
        if (
          (await nextButton.isVisible()) &&
          !(await nextButton.isDisabled())
        ) {
          await nextButton.click();

          // URLが変更されることを確認
          await expect(page.url()).toMatch(/page=2/);

          // 記事一覧が更新されることを確認
          await expect(page.locator(".post-list")).toBeVisible();
        }
      }
    });
  });

  test.describe("Admin Posts Management", () => {
    /**
     * 管理画面の記事一覧表示テスト
     */
    test("should display posts list in admin dashboard", async ({ page }) => {
      await loginAsAdmin(page);

      // 記事一覧の表示確認
      await expect(page.locator('h1:has-text("記事管理")')).toBeVisible();
      await expect(page.locator(".posts-table")).toBeVisible();

      // 新規作成ボタンの確認
      await expect(page.locator('button:has-text("新規作成")')).toBeVisible();

      // 記事テーブルのヘッダー確認
      await expect(page.locator('th:has-text("タイトル")')).toBeVisible();
      await expect(page.locator('th:has-text("ステータス")')).toBeVisible();
      await expect(page.locator('th:has-text("作成日")')).toBeVisible();
      await expect(page.locator('th:has-text("操作")')).toBeVisible();
    });

    /**
     * 記事作成機能テスト
     */
    test("should create new post successfully", async ({ page }) => {
      await loginAsAdmin(page);

      // 新規作成ボタンをクリック
      await page.click('button:has-text("新規作成")');

      // 記事作成フォームに入力
      await page.fill('input[name="title"]', TEST_POST.title);
      await page.fill('textarea[name="content"]', TEST_POST.content);

      // 公開設定
      await page.click('select[name="status"]');
      await page.selectOption('select[name="status"]', "published");

      // 保存ボタンをクリック
      await page.click('button[type="submit"]:has-text("保存")');

      // 成功メッセージの確認（Alert component）
      await expect(
        page.locator('[role="alert"]:has-text("記事が作成されました")'),
      ).toBeVisible();

      // 記事一覧に戻ることを確認
      await page.waitForURL(DASHBOARD_URL);

      // 作成した記事が一覧に表示されることを確認
      await expect(
        page.locator(`td:has-text("${TEST_POST.title}")`),
      ).toBeVisible();
    });

    /**
     * 記事更新機能テスト
     */
    test("should update post successfully", async ({ page }) => {
      await loginAsAdmin(page);

      // テスト記事を作成
      await createTestPost(page);
      await page.waitForURL(DASHBOARD_URL);

      // 作成した記事の編集ボタンをクリック
      const postRow = page.locator(`tr:has-text("${TEST_POST.title}")`);
      await postRow.locator('button:has-text("編集")').click();

      // 記事編集フォームで内容を更新
      await page.fill('input[name="title"]', UPDATED_POST.title);
      await page.fill('textarea[name="content"]', UPDATED_POST.content);

      // 保存ボタンをクリック
      await page.click('button[type="submit"]:has-text("更新")');

      // 成功メッセージの確認（Alert component）
      await expect(
        page.locator('[role="alert"]:has-text("記事が更新されました")'),
      ).toBeVisible();

      // 記事一覧に戻ることを確認
      await page.waitForURL(DASHBOARD_URL);

      // 更新された記事が一覧に表示されることを確認
      await expect(
        page.locator(`td:has-text("${UPDATED_POST.title}")`),
      ).toBeVisible();
    });

    /**
     * 記事削除機能テスト
     */
    test("should delete post successfully", async ({ page }) => {
      await loginAsAdmin(page);

      // テスト記事を作成
      await createTestPost(page);
      await page.waitForURL(DASHBOARD_URL);

      // 作成した記事の削除ボタンをクリック
      const postRow = page.locator(`tr:has-text("${TEST_POST.title}")`);
      await postRow.locator('button:has-text("削除")').click();

      // 削除確認ダイアログの確認
      await expect(page.locator(".delete-confirmation")).toBeVisible();
      await expect(page.locator(".delete-confirmation")).toContainText(
        "削除しますか？",
      );

      // 削除を確定
      await page.click('button:has-text("削除する")');

      // 成功メッセージの確認（Alert component）
      await expect(
        page.locator('[role="alert"]:has-text("記事が削除されました")'),
      ).toBeVisible();

      // 削除された記事が一覧から消えることを確認
      await expect(
        page.locator(`td:has-text("${TEST_POST.title}")`),
      ).not.toBeVisible();
    });

    /**
     * 記事削除キャンセルテスト
     */
    test("should cancel post deletion", async ({ page }) => {
      await loginAsAdmin(page);

      // テスト記事を作成
      await createTestPost(page);
      await page.waitForURL(DASHBOARD_URL);

      // 作成した記事の削除ボタンをクリック
      const postRow = page.locator(`tr:has-text("${TEST_POST.title}")`);
      await postRow.locator('button:has-text("削除")').click();

      // 削除確認ダイアログでキャンセル
      await page.click('button:has-text("キャンセル")');

      // ダイアログが閉じることを確認
      await expect(page.locator(".delete-confirmation")).not.toBeVisible();

      // 記事が削除されていないことを確認
      await expect(
        page.locator(`td:has-text("${TEST_POST.title}")`),
      ).toBeVisible();
    });

    /**
     * 記事公開/非公開切り替えテスト
     */
    test("should toggle post publication status", async ({ page }) => {
      await loginAsAdmin(page);

      // 下書き記事を作成
      await page.click('button:has-text("新規作成")');
      await page.fill('input[name="title"]', "Draft Post");
      await page.fill('textarea[name="content"]', "This is a draft post.");
      await page.selectOption('select[name="status"]', "draft");
      await page.click('button[type="submit"]:has-text("保存")');

      await page.waitForURL(DASHBOARD_URL);

      // 下書きステータスの確認
      const postRow = page.locator('tr:has-text("Draft Post")');
      await expect(
        postRow.locator('.status-badge:has-text("下書き")'),
      ).toBeVisible();

      // 公開に切り替え
      await postRow.locator('button:has-text("編集")').click();
      await page.selectOption('select[name="status"]', "published");
      await page.click('button[type="submit"]:has-text("更新")');

      await page.waitForURL(DASHBOARD_URL);

      // 公開ステータスの確認
      await expect(
        postRow.locator('.status-badge:has-text("公開")'),
      ).toBeVisible();
    });

    /**
     * 記事検索・フィルタリング機能テスト
     */
    test("should filter posts by status and search", async ({ page }) => {
      await loginAsAdmin(page);

      // ステータスフィルター
      await page.selectOption('select[name="statusFilter"]', "published");
      await page.waitForTimeout(500); // フィルター処理待機

      // 公開記事のみが表示されることを確認
      const statusBadges = page.locator(".status-badge");
      const badgeCount = await statusBadges.count();
      for (let i = 0; i < badgeCount; i++) {
        const badgeText = await statusBadges.nth(i).textContent();
        expect(badgeText).toBe("公開");
      }

      // 検索機能
      await page.fill('input[name="search"]', "Laravel");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500); // 検索処理待機

      // 検索結果の確認
      const searchResults = page.locator("tbody tr");
      const resultCount = await searchResults.count();

      if (resultCount > 0) {
        for (let i = 0; i < resultCount; i++) {
          const rowText = await searchResults.nth(i).textContent();
          expect(rowText?.toLowerCase()).toContain("laravel");
        }
      }
    });
  });

  test.describe("Post Form Validation", () => {
    /**
     * 記事作成フォームのバリデーションテスト
     */
    test("should validate required fields in post creation form", async ({
      page,
    }) => {
      await loginAsAdmin(page);

      // 新規作成ボタンをクリック
      await page.click('button:has-text("新規作成")');

      // 空のフォームで保存を試行
      await page.click('button[type="submit"]:has-text("保存")');

      // バリデーションエラーメッセージの確認（React Hook Form）
      await expect(
        page.locator('p.text-sm.text-red-600:has-text("タイトルは必須です")'),
      ).toBeVisible();
      await expect(
        page.locator('p.text-sm.text-red-600:has-text("内容は必須です")'),
      ).toBeVisible();
    });

    /**
     * 文字数制限のバリデーションテスト
     */
    test("should validate character limits", async ({ page }) => {
      await loginAsAdmin(page);

      await page.click('button:has-text("新規作成")');

      // 文字数制限を超えるタイトルを入力
      const longTitle = "a".repeat(256); // 255文字制限を超える
      await page.fill('input[name="title"]', longTitle);
      await page.fill('textarea[name="content"]', "Valid content");

      await page.click('button[type="submit"]:has-text("保存")');

      // バリデーションエラーメッセージの確認（React Hook Form）
      await expect(
        page.locator(
          'p.text-sm.text-red-600:has-text("タイトルは255文字以内で入力してください")',
        ),
      ).toBeVisible();
    });
  });

  test.describe("Integration Tests", () => {
    /**
     * 管理者で作成した記事が公開側に表示されるかテスト
     */
    test("should display admin-created post on public site", async ({
      page,
    }) => {
      await loginAsAdmin(page);

      // 管理者で記事を作成
      await createTestPost(page, {
        title: "Public Test Post",
        content: "This post should appear on the public site.",
      });

      // 公開サイトに移動
      await page.goto(HOME_URL);

      // 作成した記事が表示されることを確認
      await expect(page.locator(`text="Public Test Post"`)).toBeVisible();

      // 記事詳細ページに移動
      await page.click(`text="Public Test Post"`);
      await expect(
        page.locator('h1:has-text("Public Test Post")'),
      ).toBeVisible();
      await expect(
        page.locator('text="This post should appear on the public site."'),
      ).toBeVisible();
    });

    /**
     * 下書き記事が公開側に表示されないかテスト
     */
    test("should not display draft posts on public site", async ({ page }) => {
      await loginAsAdmin(page);

      // 下書き記事を作成
      await page.click('button:has-text("新規作成")');
      await page.fill('input[name="title"]', "Draft Test Post");
      await page.fill('textarea[name="content"]', "This is a draft post.");
      await page.selectOption('select[name="status"]', "draft");
      await page.click('button[type="submit"]:has-text("保存")');

      // 公開サイトに移動
      await page.goto(HOME_URL);

      // 下書き記事が表示されないことを確認
      await expect(page.locator('text="Draft Test Post"')).not.toBeVisible();
    });
  });
});
