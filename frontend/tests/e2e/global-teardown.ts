import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting global teardown for E2E tests...");

  try {
    // Clean up test data if needed
    console.log("🔧 Cleaning up test data...");

    // You can add cleanup logic here, such as:
    // - Deleting test users
    // - Clearing test posts
    // - Resetting database state

    // Example cleanup (commented out as it depends on your backend implementation):
    /*
    const { chromium } = require('@playwright/test');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Login as admin and clean up test data
    await page.request.post('http://localhost:8000/api/login', {
      data: {
        email: 'admin@example.com',
        password: 'password'
      }
    });
    
    // Delete test posts
    await page.request.delete('http://localhost:8000/api/admin/posts/test-cleanup');
    
    await context.close();
    await browser.close();
    */

    console.log("✅ Global teardown completed successfully");
  } catch (error) {
    console.error("❌ Global teardown encountered an error:", error);
    // Don't throw the error as it might prevent other cleanup from running
  }
}

export default globalTeardown;
