#!/bin/bash

# RLS Status Checker
# Verifies RLS policies and checks for performance issues

set -e

echo "🔍 Checking RLS status and performance..."

cd supabase

echo "📋 Running database linter..."
npx supabase db lint

echo ""
echo "🔒 Checking RLS status on tables..."

# Check if we can connect to local DB, otherwise use remote
if npx supabase status | grep -q "Local database"; then
    echo "Using local database..."
    PGHOST=127.0.0.1
    PGPORT=54322
    PGUSER=postgres
    PGDATABASE=postgres
else
    echo "Local database not available. Please run 'npx supabase start' first."
    echo "Or check production database directly via Supabase Dashboard."
    exit 1
fi

echo ""
echo "📊 RLS Policy Summary:"
echo "======================="

# Query to show RLS policies
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN permissive = 't' THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as type,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"

echo ""
echo "🛡️ RLS Status by Table:"
echo "======================="

psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'users', 'rate_limits')
ORDER BY tablename;
"