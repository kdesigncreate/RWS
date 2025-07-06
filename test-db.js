// Simple test script to check database connectivity and create sample data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // First, let's check if the posts table exists
    const { data: tables, error: tablesError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error('Error accessing posts table:', tablesError);
      
      // Let's try to create the tables
      console.log('Creating tables...');
      
      // Create users table
      const { error: usersError } = await supabase.rpc('create_table', {
        table_name: 'users',
        columns: `
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        `
      });
      
      if (usersError) {
        console.log('Users table might already exist or RPC not available');
      }
      
      // Create posts table
      const { error: postsError } = await supabase.rpc('create_table', {
        table_name: 'posts',
        columns: `
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          slug VARCHAR(255),
          featured_image TEXT,
          status VARCHAR(50) DEFAULT 'draft',
          published_at TIMESTAMP NULL,
          is_published BOOLEAN DEFAULT false,
          is_draft BOOLEAN DEFAULT true,
          user_id INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        `
      });
      
      if (postsError) {
        console.log('Posts table might already exist or RPC not available');
      }
    }
    
    // Check if we have any posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    console.log('Current posts in database:', posts?.length || 0);
    
    if (!posts || posts.length === 0) {
      console.log('No posts found. Creating sample data...');
      
      // Create a sample user first
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([
          {
            name: 'Admin User',
            email: 'admin@rws.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select('*')
        .single();
      
      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }
      
      console.log('Created user:', user);
      
      // Create sample posts
      const samplePosts = [
        {
          title: 'ドリブルの基本テクニック',
          content: 'ドリブルの基本的なテクニックについて詳しく解説します。まずは基本的なボールタッチから始めましょう。',
          excerpt: 'ドリブルの基本的なテクニックについて詳しく解説します。',
          slug: 'dribble-basic-techniques',
          status: 'published',
          published_at: new Date().toISOString(),
          is_published: true,
          is_draft: false,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          title: 'サッカーの練習メニュー',
          content: 'サッカーの練習メニューについて紹介します。個人練習から チーム練習まで幅広くカバーします。',
          excerpt: 'サッカーの練習メニューについて紹介します。',
          slug: 'soccer-practice-menu',
          status: 'published',
          published_at: new Date().toISOString(),
          is_published: true,
          is_draft: false,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          title: '新しい戦術について（下書き）',
          content: 'こちらは下書きの記事です。新しい戦術について研究中です。',
          excerpt: 'こちらは下書きの記事です。',
          slug: 'new-tactics-draft',
          status: 'draft',
          published_at: null,
          is_published: false,
          is_draft: true,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const { data: newPosts, error: postsInsertError } = await supabase
        .from('posts')
        .insert(samplePosts)
        .select('*');
      
      if (postsInsertError) {
        console.error('Error creating sample posts:', postsInsertError);
        return;
      }
      
      console.log('Created sample posts:', newPosts?.length || 0);
    }
    
    // Final check
    const { data: finalPosts, error: finalError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.error('Error in final check:', finalError);
      return;
    }
    
    console.log('Final posts count:', finalPosts?.length || 0);
    finalPosts?.forEach((post, index) => {
      console.log(`${index + 1}. ${post.title} (${post.status})`);
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();