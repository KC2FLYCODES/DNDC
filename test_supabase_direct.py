#!/usr/bin/env python3
"""
Direct SQL test for Supabase setup using RPC calls
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

def test_supabase_direct():
    try:
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        print(f"🔍 Direct SQL Test for Supabase...")
        print(f"URL: {SUPABASE_URL}")
        
        # Create client with service role
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test 1: Check if tables exist using direct SQL
        print(f"\n📋 Checking if tables exist...")
        
        table_check_sql = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('organizations', 'users', 'resources', 'applications', 'documents', 'alerts', 'contact_messages')
        ORDER BY table_name;
        """
        
        try:
            result = client.rpc('exec_sql', {'sql': table_check_sql}).execute()
            print(f"✅ Tables found via direct SQL")
            print(f"Result: {result}")
        except Exception as e:
            print(f"❌ Direct SQL failed: {e}")
            
            # Try alternative RPC approach
            try:
                result = client.rpc('sql', {'query': table_check_sql}).execute()
                print(f"✅ Tables found via alternative RPC")
                print(f"Result: {result}")
            except Exception as e2:
                print(f"❌ Alternative RPC failed: {e2}")
                
                # Let's try checking what schemas are available
                schema_sql = "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"
                try:
                    result = client.rpc('sql', {'query': schema_sql}).execute()
                    print(f"Available schemas: {result}")
                except Exception as e3:
                    print(f"❌ Schema check failed: {e3}")
                    print(f"Let's check the PostgREST configuration...")
                    
                    # Check PostgREST settings
                    try:
                        settings_result = client.rpc('version').execute()
                        print(f"PostgREST version info: {settings_result}")
                    except Exception as e4:
                        print(f"Could not get PostgREST info: {e4}")
                        
        # Test 2: Try to manually query the organizations table
        print(f"\n📋 Testing direct table access...")
        manual_sql = "SELECT COUNT(*) as count FROM public.organizations;"
        
        try:
            result = client.rpc('sql', {'query': manual_sql}).execute()
            print(f"✅ Organizations table accessible: {result}")
            
            # If successful, try to get the DNDC organization
            dndc_sql = "SELECT * FROM public.organizations WHERE slug = 'dndc';"
            dndc_result = client.rpc('sql', {'query': dndc_sql}).execute()
            print(f"✅ DNDC organization: {dndc_result}")
            
            return True
            
        except Exception as e:
            print(f"❌ Manual table access failed: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_supabase_direct()
    if success:
        print(f"\n🎉 Tables exist and are accessible via direct SQL!")
        print(f"The issue is likely PostgREST API schema configuration.")
    else:
        print(f"\n⚠️  Tables may not exist or there's a deeper configuration issue.")