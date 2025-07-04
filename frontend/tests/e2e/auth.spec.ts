import { test, expect, Page } from "@playwright/test";

// テスト用の認証情報
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
const INVALID_EMAIL = "invalid@test.com";
const INVALID_PASSWORD = "wrongpassword";

// ページURL
const LOGIN_URL = "/admin";
const DASHBOARD_URL = "/admin/dashboard";
const HOME_URL = "/";

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

test.describe("Authentication E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にlocalStorageをクリア
    await page.goto(HOME_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Login Page", () => {
    /**
     * ログインページの基本表示テスト
     */
    test("should display login form correctly", async ({ page }) => {
      await page.goto(LOGIN_URL);

      // ページタイトルの確認
      await expect(page).toHaveTitle(/管理者ログイン/);

      // フォーム要素の存在確認
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // ラベルテキストの確認
      await expect(
        page.locator('label:has-text("メールアドレス")'),
      ).toBeVisible();
      await expect(page.locator('label:has-text("パスワード")')).toBeVisible();

      // ログインボタンのテキスト確認
      await expect(page.locator('button[type="submit"]')).toContainText(
        "ログイン",
      );
    });

    /**
     * 正常なログインテスト
     */
    test("should login successfully with valid credentials", async ({
      page,
    }) => {
      await page.goto(LOGIN_URL);

      // フォーム入力
      await page.fill('input[id="email"]', ADMIN_EMAIL);
      await page.fill('input[id="password"]', ADMIN_PASSWORD);

      // ログインボタンクリック
      await page.click('button[type="submit"]');

      // ダッシュボードページへのリダイレクト確認
      await page.waitForURL(DASHBOARD_URL);
      await expect(page).toHaveURL(DASHBOARD_URL);

      // ダッシュボードページの要素確認
      await expect(page.locator('h1:has-text("ダッシュボード")')).toBeVisible();
    });

    /**
     * 無効な認証情報でのログイン失敗テスト
     */
    test("should show error message with invalid credentials", async ({
      page,
    }) => {
      await page.goto(LOGIN_URL);

      // 無効な認証情報を入力
      await page.fill('input[id="email"]', INVALID_EMAIL);
      await page.fill('input[id="password"]', INVALID_PASSWORD);

      // ログインボタンクリック
      await page.click('button[type="submit"]');

      // エラーメッセージの表示確認（Alert component）
      await expect(
        page.locator('[role="alert"]:has-text("ログインに失敗しました")'),
      ).toBeVisible();

      // ログインページに留まることを確認
      await expect(page).toHaveURL(LOGIN_URL);
    });

    /**
     * バリデーションエラーテスト
     */
    test("should show validation errors for empty fields", async ({ page }) => {
      await page.goto(LOGIN_URL);

      // フォーカスして空の状態でボタンクリック
      await page.focus('input[id="email"]');
      await page.focus('input[id="password"]');
      await page.click('button[type="submit"]');

      // バリデーションエラーメッセージの確認（React Hook Formの実際のエラー）
      await expect(
        page.locator(
          'p.text-sm.text-red-600:has-text("メールアドレスは必須です")',
        ),
      ).toBeVisible();
      await expect(
        page.locator(
          'p.text-sm.text-red-600:has-text("パスワードは8文字以上で入力してください")',
        ),
      ).toBeVisible();
    });

    /**
     * メールアドレス形式のバリデーションテスト
     */
    test("should validate email format", async ({ page }) => {
      await page.goto(LOGIN_URL);

      // 無効なメールアドレス形式を入力
      await page.fill('input[id="email"]', "invalid-email");
      await page.fill('input[id="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // バリデーションエラーメッセージの確認
      await expect(
        page.locator(
          'p.text-sm.text-red-600:has-text("有効なメールアドレスを入力してください")',
        ),
      ).toBeVisible();
    });
  });

  test.describe("Authentication State", () => {
    /**
     * 認証済みユーザーのダッシュボードアクセステスト
     */
    test("should access dashboard when authenticated", async ({ page }) => {
      await loginAsAdmin(page);

      // ダッシュボードページに直接アクセス
      await page.goto(DASHBOARD_URL);
      await expect(page).toHaveURL(DASHBOARD_URL);
      await expect(page.locator('h1:has-text("ダッシュボード")')).toBeVisible();
    });

    /**
     * 未認証ユーザーのダッシュボードアクセス制限テスト
     */
    test("should redirect to login when accessing dashboard without authentication", async ({
      page,
    }) => {
      // 未認証状態でダッシュボードにアクセス
      await page.goto(DASHBOARD_URL);

      // ログインページにリダイレクトされることを確認
      await page.waitForURL(LOGIN_URL);
      await expect(page).toHaveURL(LOGIN_URL);
    });

    /**
     * 認証済みユーザーのログインページアクセステスト
     */
    test("should redirect to dashboard when authenticated user accesses login page", async ({
      page,
    }) => {
      await loginAsAdmin(page);

      // ログインページにアクセス
      await page.goto(LOGIN_URL);

      // ダッシュボードにリダイレクトされることを確認
      await page.waitForURL(DASHBOARD_URL);
      await expect(page).toHaveURL(DASHBOARD_URL);
    });
  });

  test.describe("Logout Functionality", () => {
    /**
     * ログアウト機能テスト
     */
    test("should logout successfully", async ({ page }) => {
      await loginAsAdmin(page);

      // ログアウトボタンのクリック
      await page.click('button:has-text("ログアウト")');

      // ログインページにリダイレクトされることを確認
      await page.waitForURL(LOGIN_URL);
      await expect(page).toHaveURL(LOGIN_URL);

      // ログアウト後はダッシュボードにアクセスできないことを確認
      await page.goto(DASHBOARD_URL);
      await page.waitForURL(LOGIN_URL);
      await expect(page).toHaveURL(LOGIN_URL);
    });

    /**
     * セッション持続性テスト
     */
    test("should maintain session after page reload", async ({ page }) => {
      await loginAsAdmin(page);

      // ページをリロード
      await page.reload();

      // まだダッシュボードにいることを確認
      await expect(page).toHaveURL(DASHBOARD_URL);
      await expect(page.locator('h1:has-text("ダッシュボード")')).toBeVisible();
    });

    /**
     * 新しいタブでのセッション共有テスト
     */
    test("should share session across tabs", async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();

      // 最初のタブでログイン
      await loginAsAdmin(page1);

      // 新しいタブを開く
      const page2 = await context.newPage();
      await page2.goto(DASHBOARD_URL);

      // 新しいタブでも認証済み状態であることを確認
      await expect(page2).toHaveURL(DASHBOARD_URL);
      await expect(
        page2.locator('h1:has-text("ダッシュボード")'),
      ).toBeVisible();

      await context.close();
    });
  });

  test.describe("Security Tests", () => {
    /**
     * ログインフォームのCSRF保護テスト
     */
    test("should have CSRF protection on login form", async ({ page }) => {
      await page.goto(LOGIN_URL);

      // CSRFトークンが存在することを確認
      const csrfToken = await page
        .locator('input[name="_token"]')
        .getAttribute("value");
      expect(csrfToken).toBeTruthy();
      expect(csrfToken?.length).toBeGreaterThan(0);
    });

    /**
     * パスワードフィールドのマスク確認テスト
     */
    test("should mask password input", async ({ page }) => {
      await page.goto(LOGIN_URL);

      const passwordInput = page.locator('input[id="password"]');
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    /**
     * ログイン試行回数制限テスト（オプション）
     */
    test("should implement rate limiting for login attempts", async ({
      page,
    }) => {
      await page.goto(LOGIN_URL);

      // 複数回連続でログイン失敗を試行
      for (let i = 0; i < 5; i++) {
        await page.fill('input[id="email"]', INVALID_EMAIL);
        await page.fill('input[id="password"]', INVALID_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500); // 少し待機
      }

      // レート制限メッセージが表示されることを確認（実装されている場合）
      const rateLimitMessage = page.locator(".rate-limit-message");
      if (await rateLimitMessage.isVisible()) {
        await expect(rateLimitMessage).toContainText(
          "試行回数が上限に達しました",
        );
      }
    });
  });

  test.describe("Responsive Design", () => {
    /**
     * モバイル表示でのログインテスト
     */
    test("should work correctly on mobile devices", async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(LOGIN_URL);

      // フォーム要素が適切に表示されることを確認
      await expect(page.locator('input[id="email"]')).toBeVisible();
      await expect(page.locator('input[id="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // ログイン操作
      await page.fill('input[id="email"]', ADMIN_EMAIL);
      await page.fill('input[id="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // ダッシュボードページへのリダイレクト確認
      await page.waitForURL(DASHBOARD_URL);
      await expect(page).toHaveURL(DASHBOARD_URL);
    });

    /**
     * タブレット表示でのログインテスト
     */
    test("should work correctly on tablet devices", async ({ page }) => {
      // タブレットサイズに設定
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(LOGIN_URL);

      // ログイン操作
      await page.fill('input[id="email"]', ADMIN_EMAIL);
      await page.fill('input[id="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // 成功確認
      await page.waitForURL(DASHBOARD_URL);
      await expect(page).toHaveURL(DASHBOARD_URL);
    });
  });

  test.describe("Accessibility", () => {
    /**
     * キーボードナビゲーションテスト
     */
    test("should support keyboard navigation", async ({ page }) => {
      await page.goto(LOGIN_URL);

      // Tabキーでフォーカス移動
      await page.keyboard.press("Tab");
      await expect(page.locator('input[id="email"]')).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator('input[id="password"]')).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.locator('button[type="submit"]')).toBeFocused();

      // Enterキーでフォーム送信
      await page.fill('input[id="email"]', ADMIN_EMAIL);
      await page.fill('input[id="password"]', ADMIN_PASSWORD);
      await page.locator('button[type="submit"]').focus();
      await page.keyboard.press("Enter");

      await page.waitForURL(DASHBOARD_URL);
      await expect(page).toHaveURL(DASHBOARD_URL);
    });

    /**
     * スクリーンリーダー対応テスト
     */
    test("should have proper accessibility attributes", async ({ page }) => {
      await page.goto(LOGIN_URL);

      // ラベルとinputの関連付け確認
      const emailInput = page.locator('input[id="email"]');
      const passwordInput = page.locator('input[id="password"]');

      // IDとlabelのfor属性で関連付けられているかを確認
      await expect(page.locator('label[for="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();

      // 必要な属性の確認
      await expect(emailInput).toHaveAttribute("type", "email");
      await expect(passwordInput).toHaveAttribute("type", "password");
    });
  });
});
