#!/bin/bash

# Supabase Auth Setup Script
# This script helps set up Supabase Auth for the RWS Blog system

set -e

echo "🔐 Setting up Supabase Auth for RWS Blog..."

# Check if we're in the correct directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

cd supabase

echo "📝 Deploying auth-enabled API functions..."
npx supabase functions deploy api

echo "🔑 Setting up authentication configuration..."

# Note: The admin user needs to be created manually in Supabase Dashboard
echo ""
echo "📋 Manual steps required:"
echo "======================="
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to Authentication > Users"
echo "3. Click 'Add user' and create:"
echo "   - Email: admin@rws.com"
echo "   - Password: password123!!"
echo "   - Auto-confirm: Yes"
echo ""
echo "4. After creating the user, run this SQL in the SQL Editor:"
echo ""
cat ../scripts/create-admin-user.sql
echo ""
echo "5. Update your environment variables:"
echo "   - Ensure NEXT_PUBLIC_SUPABASE_URL is set"
echo "   - Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
echo "   - Ensure SUPABASE_SERVICE_ROLE_KEY is set (for server-side operations)"
echo ""
echo "✅ Supabase Functions deployed successfully!"
echo "📝 Complete the manual steps above to finish setup."