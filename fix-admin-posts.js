// Script to fix the admin posts issue
// This script will call the fix-status-fields endpoint to correct database inconsistencies

const API_BASE = 'https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/api';

async function fixPostsStatus() {
  try {
    console.log('🔧 Attempting to fix post status fields...');
    
    // First, let's see the current state
    const debugResponse = await fetch(`${API_BASE}/debug-posts`);
    const debugData = await debugResponse.json();
    
    console.log('📊 Current posts in database:', debugData.data.count);
    
    // Show status field issues
    const publishedPosts = debugData.data.posts.filter(p => p.status === 'published');
    const incorrectPublished = publishedPosts.filter(p => !p.is_published);
    
    console.log('❌ Published posts with incorrect is_published field:', incorrectPublished.length);
    
    if (incorrectPublished.length > 0) {
      console.log('🔍 Example incorrect post:', {
        title: incorrectPublished[0].title,
        status: incorrectPublished[0].status,
        is_published: incorrectPublished[0].is_published,
        is_draft: incorrectPublished[0].is_draft
      });
    }
    
    // Note: The fix-status-fields endpoint requires authentication
    // For now, we'll just document what needs to be done
    console.log('');
    console.log('🚨 SOLUTION NEEDED:');
    console.log('1. Authenticate as admin user to get a token');
    console.log('2. Call POST /fix-status-fields with Authorization header');
    console.log('3. This will update all posts to have correct is_published/is_draft fields');
    console.log('');
    console.log('Expected result:');
    console.log('- Posts with status="published" → is_published=true, is_draft=false');
    console.log('- Posts with status="draft" → is_published=false, is_draft=true');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPostsStatus();