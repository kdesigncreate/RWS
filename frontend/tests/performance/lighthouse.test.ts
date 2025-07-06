/**
 * Lighthouseパフォーマンステスト
 */

import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Lighthouse Performance Tests', () => {
  test('ホームページのパフォーマンス', async ({ page, browser }) => {
    await page.goto('/');
    
    await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
      },
      port: 9222,
    });
  });

  test('記事詳細ページのパフォーマンス', async ({ page, browser }) => {
    await page.goto('/info/1');
    
    await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
      },
      port: 9222,
    });
  });

  test('管理画面のパフォーマンス', async ({ page, browser }) => {
    // ログイン
    await page.goto('/admin');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // ダッシュボードの監査
    await page.waitForURL('/admin/dashboard');
    
    await playAudit({
      page,
      thresholds: {
        performance: 70, // 管理画面は少し緩い基準
        accessibility: 90,
        'best-practices': 90,
        seo: 50, // 管理画面はSEOは重要でない
      },
      port: 9222,
    });
  });
});

test.describe('Core Web Vitals', () => {
  test('LCP (Largest Contentful Paint) が適切な値である', async ({ page }) => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // LCPは2.5秒以下であることを期待
    expect(lcp).toBeLessThan(2500);
  });

  test('FID (First Input Delay) が適切な値である', async ({ page }) => {
    await page.goto('/');
    
    // ページ上のボタンをクリックしてFIDを測定
    const button = page.locator('button').first();
    await button.click();
    
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            resolve(entries[0].processingStart - entries[0].startTime);
          }
        }).observe({ entryTypes: ['first-input'] });
      });
    });
    
    // FIDは100ms以下であることを期待
    expect(fid).toBeLessThan(100);
  });

  test('CLS (Cumulative Layout Shift) が適切な値である', async ({ page }) => {
    await page.goto('/');
    
    // ページの読み込み完了を待つ
    await page.waitForLoadState('networkidle');
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // 5秒後にCLS値を返す
        setTimeout(() => resolve(clsValue), 5000);
      });
    });
    
    // CLSは0.1以下であることを期待
    expect(cls).toBeLessThan(0.1);
  });
});