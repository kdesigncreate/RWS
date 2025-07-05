import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/R\.W\.S/);
    
    // メインヘッダーの存在確認
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    // ナビゲーションメニューの確認
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // ナビゲーションリンクの確認
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/news"]')).toBeVisible();
  });

  test('should display YouTube videos section', async ({ page }) => {
    // YouTubeセクションまでスクロール
    await page.locator('#videos').scrollIntoViewIfNeeded();
    
    // YouTube動画セクションの確認
    await expect(page.locator('#videos')).toBeVisible();
    await expect(page.locator('#videos h2')).toContainText('Videos');
    
    // LazyYouTubeコンポーネントの確認
    const videoComponents = page.locator('[data-testid="lazy-youtube"]');
    await expect(videoComponents).toHaveCount(3);
  });

  test('should load YouTube video on click', async ({ page }) => {
    // 最初のYouTube動画のプレイボタンをクリック
    await page.locator('#videos').scrollIntoViewIfNeeded();
    const firstVideo = page.locator('[data-testid="lazy-youtube"]').first();
    const playButton = firstVideo.locator('button[aria-label*="Play"]');
    
    await expect(playButton).toBeVisible();
    await playButton.click();
    
    // iframeが読み込まれることを確認
    const iframe = firstVideo.locator('iframe');
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com/);
  });

  test('should display posts section', async ({ page }) => {
    // 記事セクションの確認
    const postsSection = page.locator('[data-testid="posts-section"]');
    await expect(postsSection).toBeVisible();
    
    // 記事がある場合の確認（記事がない場合は "記事がありません" メッセージ）
    const posts = page.locator('[data-testid="post-card"]');
    const noPostsMessage = page.locator('text=記事がありません');
    
    // 記事があるか、"記事がありません"メッセージがあるか
    await expect(posts.or(noPostsMessage)).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ページが正常に表示されることを確認
    await expect(page.locator('h1')).toBeVisible();
    
    // ナビゲーションが適切に表示されることを確認
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // メタタグの確認
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /R\.W\.S/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /R\.W\.S/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // セキュリティヘッダーの確認
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    expect(response?.headers()['x-frame-options']).toBe('SAMEORIGIN');
    expect(response?.headers()['content-security-policy']).toBeTruthy();
  });
});