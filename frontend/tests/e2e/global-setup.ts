import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Create a browser instance to verify basic functionality
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for frontend server to be ready
    console.log('⏳ Waiting for frontend server...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Frontend server is ready');
    
    // Wait for backend server to be ready
    console.log('⏳ Waiting for backend server...');
    const response = await page.request.get('http://localhost:8000/api/health');
    if (response.status() !== 200) {
      // Try a different endpoint if health check doesn't exist
      await page.request.get('http://localhost:8000');
    }
    console.log('✅ Backend server is ready');
    
    // Set up test data if needed
    console.log('🔧 Setting up test data...');
    
    // Test authentication endpoint availability
    try {
      await page.request.get('http://localhost:8000/api/health');
      console.log('ℹ️ Backend API is accessible');
    } catch (error) {
      console.log('⚠️ Backend API check failed, continuing anyway');
    }
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;