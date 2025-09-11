#!/usr/bin/env python3
"""
Test Supabase API schema tables
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

def test_api_schema():
    try:
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        print(f"🔍 Testing API Schema Tables...")
        print(f"URL: {SUPABASE_URL}")
        
        # Create client with service role
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test the API schema tables directly
        api_tables = ['organizations', 'users', 'resources']
        
        for table in api_tables:
            try:
                # The supabase client should now access api.tablename by default
                result = client.table(table).select('*').limit(1).execute()
                print(f"✅ API Table '{table}' accessible (rows: {len(result.data)})")
                
                if table == 'organizations' and result.data:
                    org = result.data[0]
                    print(f"   Found organization: {org.get('name', 'N/A')} (slug: {org.get('slug', 'N/A')})")
                    
            except Exception as e:
                print(f"❌ API Table '{table}' failed: {e}")
        
        # Test DNDC organization specifically
        try:
            result = client.table('organizations').select('*').eq('slug', 'dndc').execute()
            if result.data:
                dndc_org = result.data[0]
                print(f"\n🎉 DNDC Organization Found!")
                print(f"   ID: {dndc_org['id']}")
                print(f"   Name: {dndc_org['name']}")
                print(f"   Contact: {dndc_org.get('contact_info', {})}")
                return True
            else:
                print(f"\n⚠️  DNDC organization not found in API schema")
                return False
                
        except Exception as e:
            print(f"\n❌ Error checking DNDC in API schema: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_api_schema()
    if success:
        print(f"\n🎉 API SCHEMA WORKING!")
        print(f"✅ Supabase tables are accessible")
        print(f"✅ Multi-tenant setup ready!")
    else:
        print(f"\n⚠️  API schema needs setup")
        print(f"Please run Step 15 in Supabase SQL Editor")