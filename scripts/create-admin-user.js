#!/usr/bin/env node

// Admin user creation script for Supabase
// This script creates an admin user using Supabase Admin API

// Production Supabase configuration
const SUPABASE_URL = 'https://ixrwzaasrxoshjnpxnme.supabase.co';
// This should be the service_role key from Supabase dashboard
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create user via Supabase Admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        email: 'admin@rws.com',
        password: 'password123!!',
        email_confirm: true,
        user_metadata: {
          name: 'Kamura',
          role: 'admin'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create user:', response.status, errorText);
      
      // Check if user already exists
      if (response.status === 422 || errorText.includes('already been registered')) {
        console.log('User already exists, attempting to update...');
        await updateExistingUser();
        return;
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const userData = await response.json();
    console.log('Admin user created successfully:', userData.user.email);
    console.log('User ID:', userData.user.id);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

async function updateExistingUser() {
  try {
    // Get user first
    const getUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=admin@rws.com`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });

    if (!getUserResponse.ok) {
      throw new Error(`Failed to get user: ${getUserResponse.status}`);
    }

    const users = await getUserResponse.json();
    if (!users.users || users.users.length === 0) {
      throw new Error('User not found');
    }

    const userId = users.users[0].id;
    console.log('Found existing user:', userId);

    // Update user password and metadata
    const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        password: 'password123!!',
        email_confirm: true,
        user_metadata: {
          name: 'Kamura',
          role: 'admin'
        }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update user: ${updateResponse.status} ${errorText}`);
    }

    const updatedUser = await updateResponse.json();
    console.log('Admin user updated successfully:', updatedUser.email);
    
  } catch (error) {
    console.error('Error updating existing user:', error);
    throw error;
  }
}

async function verifyUser() {
  try {
    console.log('\nVerifying user creation...');
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=admin@rws.com`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to verify user: ${response.status}`);
    }

    const users = await response.json();
    if (users.users && users.users.length > 0) {
      const user = users.users[0];
      console.log('✅ Admin user verified:');
      console.log('  Email:', user.email);
      console.log('  ID:', user.id);
      console.log('  Name:', user.user_metadata?.name);
      console.log('  Role:', user.user_metadata?.role);
      console.log('  Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('  Created:', user.created_at);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('Error verifying user:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting admin user creation process...');
  await createAdminUser();
  await verifyUser();
  console.log('✅ Admin user setup completed!');
  console.log('\nYou can now login with:');
  console.log('  Email: admin@rws.com');
  console.log('  Password: password123!!');
}

main().catch(console.error);