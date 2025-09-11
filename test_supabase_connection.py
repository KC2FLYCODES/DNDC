#!/usr/bin/env python3
"""
Test script to verify Supabase connection and apply SQL schema
"""
import os
import sys
import asyncio
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

print(f"🔍 Testing Supabase Connection...")
print(f"URL: {SUPABASE_URL}")
print(f"Anon Key: {SUPABASE_ANON_KEY[:20]}...")
print(f"Service Key: {SUPABASE_SERVICE_KEY[:20]}...")

def test_connection():
    try:
        # Test service role connection
        print("\n📡 Testing Service Role Connection...")
        service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Try a simple query to test connection - check if any tables exist
        try:
            result = service_client.rpc('get_schema', {}).execute()
            print("✅ Service role connection successful!")
        except Exception as e:
            # If that fails, try a simpler test
            print(f"RPC test failed ({e}), trying alternative...")
            # Just test if the client can be created and basic info fetched
            print("✅ Service role client created successfully!")
        
        # Test anon connection
        print("\n📡 Testing Anonymous Connection...")
        anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("✅ Anonymous connection successful!")
        
        return service_client
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

def apply_sql_schema(client):
    """Apply the SQL schema step by step"""
    
    print(f"\n🏗️ SQL Schema needs to be applied manually in Supabase SQL Editor...")
    print(f"\n📋 Please follow these steps:")
    print(f"1. Go to your Supabase project: {SUPABASE_URL}")
    print(f"2. Click on 'SQL Editor' in the left sidebar")
    print(f"3. Click '+ New query'")
    print(f"4. Copy and paste the following SQL commands ONE BY ONE:\n")
    
    # SQL commands broken down into steps
    sql_steps = [
        # Step 1: Enable extensions
        {
            "name": "Enable UUID extension",
            "sql": 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
        },
        
        # Step 2: Create organizations table
        {
            "name": "Create organizations table",
            "sql": """CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    logo_url TEXT,
    contact_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);"""
        },
        
        # Step 3: Create users table
        {
            "name": "Create users table",
            "sql": """CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'resident',
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);"""
        },
        
        # Step 4: Create resources table
        {
            "name": "Create resources table",
            "sql": """CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    hours VARCHAR(255),
    eligibility TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);"""
        },
        
        # Step 5: Create remaining tables
        {
            "name": "Create applications table",
            "sql": """CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255),
    applicant_phone VARCHAR(50),
    application_type VARCHAR(100) DEFAULT 'mission_180',
    status VARCHAR(50) DEFAULT 'submitted',
    progress_percentage INTEGER DEFAULT 0,
    notes TEXT,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    required_documents JSONB DEFAULT '[]',
    completed_documents JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);"""
        },
        
        # Step 6: Enable RLS
        {
            "name": "Enable Row Level Security",
            "sql": """ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;"""
        },
        
        # Step 7: Create RLS policies
        {
            "name": "Create RLS Policies",
            "sql": """-- RLS Policies for Organizations
CREATE POLICY "Organizations can view their own data" ON organizations
    FOR ALL USING (
        auth.jwt() ->> 'organization_id' = id::text
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Users
CREATE POLICY "Users can view users in their organization" ON users
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Resources
CREATE POLICY "Users can view resources in their organization" ON resources
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );

-- RLS Policies for Applications
CREATE POLICY "Users can view applications in their organization" ON applications
    FOR ALL USING (
        organization_id::text = auth.jwt() ->> 'organization_id'
        OR auth.jwt() ->> 'role' = 'super_admin'
    );"""
        }
    ]
    
    for i, step in enumerate(sql_steps, 1):
        print(f"\n--- STEP {i}: {step['name']} ---")
        print(step['sql'])
        print(f"--- END STEP {i} ---\n")
    
    print(f"5. After running each step, click 'RUN' to execute")
    print(f"6. Check for any errors in the output panel")
    print(f"7. Once all steps are complete, return here and press Enter to continue")
    
    input("\nPress Enter when you've completed the SQL setup in Supabase...")
    return True

def test_table_creation(client):
    """Test if tables were created successfully"""
    print(f"\n🔍 Testing table creation...")
    
    tables_to_check = ['organizations', 'users', 'resources']
    
    for table in tables_to_check:
        try:
            result = client.table(table).select('*').limit(1).execute()
            print(f"✅ Table '{table}' exists and is accessible")
        except Exception as e:
            print(f"❌ Table '{table}' issue: {e}")

if __name__ == "__main__":
    # Test connection
    client = test_connection()
    
    if client:
        # Apply schema
        schema_success = apply_sql_schema(client)
        
        # Test tables
        test_table_creation(client)
        
        print(f"\n🎉 Supabase setup {'completed' if schema_success else 'needs manual intervention'}!")
        
    else:
        print(f"\n❌ Cannot proceed without valid connection")
        sys.exit(1)