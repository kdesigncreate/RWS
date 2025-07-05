import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // 管理画面にアクセス
    await page.goto('/admin');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // 未認証の場合、ログインページまたはログインフォームが表示されることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display login form', async ({ page }) => {
    // ログインフォームの要素確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    // 無効な認証情報でログイン試行
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=Invalid credentials').or(page.locator('text=認証に失敗'))).toBeVisible();
  });

  // 注意: 実際のテスト環境では、テスト用のユーザーアカウントを使用してください
  test.skip('should login with valid credentials and access dashboard', async ({ page }) => {
    // 有効な認証情報でログイン（実際のテストでは環境変数から取得）
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'password');
    await page.click('button[type="submit"]');
    
    // ダッシュボードページが表示されることを確認
    await expect(page.locator('h1')).toContainText('ダッシュボード');
    
    // 統計カードが表示されることを確認
    await expect(page.locator('text=総記事数')).toBeVisible();
    await expect(page.locator('text=公開中')).toBeVisible();
    await expect(page.locator('text=下書き')).toBeVisible();
    
    // 新しい記事ボタンが表示されることを確認
    await expect(page.locator('text=新しい記事')).toBeVisible();
  });

  test.skip('should create new post', async ({ page }) => {
    // 事前にログインが必要（上記のテストの続き）
    // ...ログイン処理...
    
    // 新しい記事ボタンをクリック
    await page.click('text=新しい記事');
    
    // 記事作成フォームが表示されることを確認
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
    
    // 記事情報を入力
    await page.fill('input[name="title"]', 'Test Post Title');
    await page.fill('textarea[name="content"]', 'This is a test post content.');
    
    // 下書きとして保存
    await page.click('button:has-text("下書き保存")');
    
    // 成功メッセージが表示されることを確認
    await expect(page.locator('text=保存しました').or(page.locator('text=作成しました'))).toBeVisible();
  });

  test('should have proper admin security', async ({ page }) => {
    const response = await page.goto('/admin');
    
    // 管理画面専用のセキュリティヘッダーが設定されていることを確認
    expect(response?.headers()['x-admin-access']).toBe('true');
    expect(response?.headers()['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ログインフォームが適切に表示されることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // ネットワークをオフラインに設定
    await page.context().setOffline(true);
    
    // ログイン試行
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // ネットワークエラーメッセージが表示されることを確認
    await expect(page.locator('text=ネットワークエラー').or(page.locator('text=接続エラー'))).toBeVisible();
    
    // ネットワークを再度有効化
    await page.context().setOffline(false);
  });
});