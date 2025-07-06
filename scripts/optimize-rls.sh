#!/bin/bash

# RLS Policy Optimization Script
# This script applies optimized RLS policies to resolve performance warnings

set -e

echo "🔧 Optimizing Supabase RLS policies for performance..."

# Check if we're in the correct directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

# Apply the migration
echo "📝 Applying RLS optimization migration..."
cd supabase

# Push the migration to production
npx supabase db push --include-all

echo "✅ RLS policies optimized successfully!"
echo ""
echo "📊 Optimizations applied:"
echo "  - Consolidated duplicate policies to eliminate 'Multiple Permissive Policies' warnings"
echo "  - Wrapped auth functions in SELECT statements for better performance"
echo "  - Simplified policy structure while maintaining security"
echo ""
echo "🔍 To verify the changes, run:"
echo "  npx supabase db lint"