/**
 * ボタンコンポーネントのビジュアルリグレッションテスト
 */

import { test, expect } from '@playwright/test';

test.describe('Button Component Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // テストページに移動
    await page.goto('/test/components/button');
  });

  test('デフォルトボタンの表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-default"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveScreenshot('button-default.png');
  });

  test('プライマリボタンの表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-primary"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveScreenshot('button-primary.png');
  });

  test('セカンダリボタンの表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-secondary"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveScreenshot('button-secondary.png');
  });

  test('破壊的ボタンの表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-destructive"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveScreenshot('button-destructive.png');
  });

  test('無効化ボタンの表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-disabled"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveScreenshot('button-disabled.png');
  });

  test('ローディング状態ボタンの表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-loading"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveScreenshot('button-loading.png');
  });

  test('サイズバリエーションの表示が正しい', async ({ page }) => {
    const container = page.locator('[data-testid="button-sizes"]');
    await expect(container).toBeVisible();
    await expect(container).toHaveScreenshot('button-sizes.png');
  });

  test('ホバー状態の表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-primary"]');
    await button.hover();
    await expect(button).toHaveScreenshot('button-primary-hover.png');
  });

  test('フォーカス状態の表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-primary"]');
    await button.focus();
    await expect(button).toHaveScreenshot('button-primary-focus.png');
  });

  test('アクティブ状態の表示が正しい', async ({ page }) => {
    const button = page.locator('[data-testid="button-primary"]');
    await button.press('Space');
    await expect(button).toHaveScreenshot('button-primary-active.png');
  });
});