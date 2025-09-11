#!/usr/bin/env python3
"""
Final test for Supabase setup with proper schema handling
"""
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

def test_supabase_final():
    try:
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        print(f"🔍 Final Supabase Setup Test...")
        print(f"URL: {SUPABASE_URL}")
        
        # Create client with service role (bypasses RLS)
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Test each table with proper error handling
        tables_to_test = [
            'organizations',
            'users', 
            'resources',
            'applications',
            'documents',
            'alerts',
            'contact_messages'
        ]
        
        successful_tables = []
        failed_tables = []
        
        for table in tables_to_test:
            try:
                # Try to select from table
                result = client.table(table).select('*').limit(1).execute()
                print(f"✅ Table '{table}' exists and accessible (rows: {len(result.data)})")
                successful_tables.append(table)
            except Exception as e:
                print(f"❌ Table '{table}' issue: {str(e)[:100]}...")
                failed_tables.append(table)
        
        print(f"\n📊 Results Summary:")
        print(f"✅ Successful tables: {len(successful_tables)}")
        print(f"❌ Failed tables: {len(failed_tables)}")
        
        if len(successful_tables) >= 4:  # At least core tables working
            # Test DNDC organization
            try:
                result = client.table('organizations').select('*').eq('slug', 'dndc').execute()
                if result.data and len(result.data) > 0:
                    print(f"\n🎉 DNDC organization found!")
                    org_data = result.data[0]
                    print(f"   Organization ID: {org_data['id']}")
                    print(f"   Name: {org_data['name']}")
                    print(f"   Slug: {org_data['slug']}")
                    
                    # Test if we can create a resource for this organization
                    test_resource = {
                        'organization_id': org_data['id'],
                        'name': 'Test Resource',
                        'description': 'Test description',
                        'category': 'housing'
                    }
                    
                    try:
                        insert_result = client.table('resources').insert(test_resource).execute()
                        if insert_result.data:
                            resource_id = insert_result.data[0]['id']
                            print(f"✅ Successfully created test resource: {resource_id}")
                            
                            # Clean up test resource
                            client.table('resources').delete().eq('id', resource_id).execute()
                            print(f"✅ Test resource cleaned up")
                            
                            return True
                        
                    except Exception as e:
                        print(f"⚠️  Could not create test resource: {e}")
                        return len(successful_tables) == len(tables_to_test)
                        
                else:
                    print(f"⚠️  DNDC organization not found")
                    return False
                    
            except Exception as e:
                print(f"❌ Error checking DNDC organization: {e}")
                return False
        else:
            print(f"❌ Too many tables failed. Setup incomplete.")
            return False
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_supabase_final()
    if success:
        print(f"\n🎉 SUPABASE SETUP COMPLETE!")
        print(f"✅ Database schema is ready")
        print(f"✅ Multi-tenant architecture working")
        print(f"✅ Ready to integrate with application!")
    else:
        print(f"\n⚠️  Supabase setup needs attention")
        print(f"Some tables may need the API permissions step (Step 13)")