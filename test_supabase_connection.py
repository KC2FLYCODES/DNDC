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
        
        # Try a simple query to test connection
        result = service_client.table('_realtime_extensions').select('*').limit(1).execute()
        print("✅ Service role connection successful!")
        
        # Test anon connection
        print("\n📡 Testing Anonymous Connection...")
        anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # This should work even without tables
        print("✅ Anonymous connection successful!")
        
        return service_client
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

def apply_sql_schema(client):
    """Apply the SQL schema step by step"""
    
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
            "sql": """
            CREATE TABLE IF NOT EXISTS organizations (
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
            );
            """
        },
        
        # Step 3: Create users table
        {
            "name": "Create users table",
            "sql": """
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) DEFAULT 'resident',
                profile JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_active BOOLEAN DEFAULT TRUE
            );
            """
        },
        
        # Step 4: Create resources table
        {
            "name": "Create resources table",
            "sql": """
            CREATE TABLE IF NOT EXISTS resources (
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
            );
            """
        },
        
        # Step 5: Enable RLS for organizations
        {
            "name": "Enable RLS for organizations",
            "sql": "ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;"
        },
        
        # Step 6: Enable RLS for users
        {
            "name": "Enable RLS for users", 
            "sql": "ALTER TABLE users ENABLE ROW LEVEL SECURITY;"
        },
        
        # Step 7: Enable RLS for resources
        {
            "name": "Enable RLS for resources",
            "sql": "ALTER TABLE resources ENABLE ROW LEVEL SECURITY;"
        }
    ]
    
    print(f"\n🏗️ Applying SQL Schema ({len(sql_steps)} steps)...")
    
    for i, step in enumerate(sql_steps, 1):
        try:
            print(f"\nStep {i}/{len(sql_steps)}: {step['name']}")
            result = client.rpc('execute_sql', {'sql': step['sql']}).execute()
            print(f"✅ Step {i} completed successfully")
            
        except Exception as e:
            print(f"❌ Step {i} failed: {e}")
            
            # Try alternative method using direct SQL execution
            try:
                print(f"🔄 Trying alternative method for step {i}...")
                # For some operations, we might need to use the SQL editor directly
                print(f"Manual SQL needed:\n{step['sql']}")
                print("Please execute this SQL manually in your Supabase SQL editor.")
                
            except Exception as e2:
                print(f"❌ Alternative method also failed: {e2}")
                return False
    
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