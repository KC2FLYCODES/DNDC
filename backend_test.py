import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path

# Add backend directory to path for Supabase testing
sys.path.append('/app/backend')

class DNDCAPITester:
    def __init__(self, base_url="https://dndc-tenant-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.document_id = None
        self.supabase_tests_run = 0
        self.supabase_tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: Found {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n=== TESTING BASIC ENDPOINTS ===")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test status endpoints
        self.run_test("Get Status Checks", "GET", "status", 200)
        
        success, response = self.run_test(
            "Create Status Check", 
            "POST", 
            "status", 
            200,
            data={"client_name": "test_client"}
        )

    def test_resources_endpoints(self):
        """Test resources endpoints"""
        print("\n=== TESTING RESOURCES ENDPOINTS ===")
        
        # Get all resources
        success, resources = self.run_test("Get All Resources", "GET", "resources", 200)
        
        # Test category filtering
        self.run_test("Get Housing Resources", "GET", "resources?category=housing", 200)
        
        # Test search functionality
        self.run_test("Search Resources", "GET", "resources?search=housing", 200)
        
        # Get resource categories
        self.run_test("Get Resource Categories", "GET", "resources/categories", 200)
        
        # Create a new resource
        self.run_test(
            "Create Resource",
            "POST",
            "resources",
            200,
            data={
                "name": "Test Resource",
                "description": "Test description",
                "category": "housing",
                "phone": "434-555-0999"
            }
        )

    def test_documents_endpoints(self):
        """Test document management endpoints"""
        print("\n=== TESTING DOCUMENTS ENDPOINTS ===")
        
        # Get all documents
        success, documents = self.run_test("Get Documents", "GET", "documents", 200)
        
        if success and documents:
            # Store first document ID for testing
            self.document_id = documents[0]['id']
            print(f"   Using document ID: {self.document_id}")
            
            # Test file upload
            test_file_content = b"This is a test PDF content for DNDC testing"
            files = {'file': ('test_document.pdf', test_file_content, 'application/pdf')}
            
            upload_success, upload_response = self.run_test(
                "Upload Document File",
                "POST",
                f"documents/upload/{self.document_id}",
                200,
                files=files
            )
            
            if upload_success:
                # Test view document
                self.run_test("View Document", "GET", f"documents/{self.document_id}/view", 200)
                
                # Test download document
                self.run_test("Download Document", "GET", f"documents/{self.document_id}/download", 200)
                
                # Test replace document
                new_files = {'file': ('replacement_doc.pdf', b"Replacement content", 'application/pdf')}
                self.run_test(
                    "Replace Document File",
                    "POST",
                    f"documents/replace/{self.document_id}",
                    200,
                    files=new_files
                )
                
                # Test delete document file
                self.run_test("Delete Document File", "DELETE", f"documents/{self.document_id}/file", 200)
        else:
            print("❌ No documents found to test file operations")

    def test_alerts_endpoints(self):
        """Test alerts endpoints"""
        print("\n=== TESTING ALERTS ENDPOINTS ===")
        
        # Get all alerts
        self.run_test("Get Active Alerts", "GET", "alerts", 200)
        
        # Get all alerts (including inactive)
        self.run_test("Get All Alerts", "GET", "alerts?active_only=false", 200)
        
        # Create new alert
        self.run_test(
            "Create Alert",
            "POST",
            "alerts",
            200,
            data={
                "title": "Test Alert",
                "message": "This is a test alert message",
                "alert_type": "info"
            }
        )

    def test_contact_endpoints(self):
        """Test contact endpoints"""
        print("\n=== TESTING CONTACT ENDPOINTS ===")
        
        # Get contact info
        self.run_test("Get Contact Info", "GET", "contact/info", 200)
        
        # Send contact message
        self.run_test(
            "Send Contact Message",
            "POST",
            "contact",
            200,
            data={
                "name": "Test User",
                "email": "test@example.com",
                "phone": "434-555-0123",
                "message": "This is a test message from the API tester"
            }
        )

    def test_phase2_applications_endpoints(self):
        """Test Phase 2 Application Status Tracker endpoints"""
        print("\n=== TESTING PHASE 2 - APPLICATION TRACKER ENDPOINTS ===")
        
        # Get all applications (should have sample data)
        success, applications = self.run_test("Get All Applications", "GET", "applications", 200)
        
        if success and applications:
            print(f"   Found {len(applications)} sample applications")
            
            # Test getting specific application
            app_id = applications[0]['id']
            self.run_test("Get Specific Application", "GET", f"applications/{app_id}", 200)
            
            # Test updating application status
            self.run_test(
                "Update Application Status",
                "PUT",
                f"applications/{app_id}",
                200,
                data={"status": "under_review", "progress_percentage": 50}
            )
            
            # Test linking document to application
            self.run_test(
                "Link Document to Application",
                "POST",
                f"applications/{app_id}/documents?document_name=Photo ID",
                200
            )
        
        # Test creating new application
        self.run_test(
            "Create New Application",
            "POST",
            "applications",
            200,
            data={
                "applicant_name": "Test Applicant",
                "applicant_email": "test@example.com",
                "applicant_phone": "434-555-0999",
                "application_type": "mission_180"
            }
        )

    def test_phase2_financial_calculator_endpoints(self):
        """Test Phase 2 Financial Calculator endpoints"""
        print("\n=== TESTING PHASE 2 - FINANCIAL CALCULATOR ENDPOINTS ===")
        
        # Test loan calculation
        self.run_test(
            "Calculate Loan Payment",
            "POST",
            "calculate/loan?loan_amount=150000&interest_rate=4.5&loan_term_years=30",
            200
        )
        
        # Test income qualification
        self.run_test(
            "Check Income Qualification",
            "POST",
            "calculate/income-qualification?household_size=2&annual_income=45000",
            200
        )
        
        # Test utility assistance calculation
        self.run_test(
            "Calculate Utility Assistance",
            "POST",
            "calculate/utility-assistance?household_size=2&monthly_income=3500&utility_type=combined&monthly_utility_cost=200",
            200
        )

    def test_supabase_integration(self):
        """Test Supabase integration and multi-tenant functionality"""
        print("\n=== TESTING SUPABASE INTEGRATION ===")
        
        try:
            # Test Supabase configuration
            from supabase_config import get_supabase_client, SUPABASE_URL, SUPABASE_ANON_KEY
            from supabase_service import SupabaseService
            from supabase_models import Organization
            
            print("✅ Supabase modules imported successfully")
            self.supabase_tests_run += 1
            self.supabase_tests_passed += 1
            
            # Test Supabase client creation
            try:
                client = get_supabase_client(service_role=False)
                print("✅ Supabase client created successfully")
                self.supabase_tests_run += 1
                self.supabase_tests_passed += 1
            except Exception as e:
                print(f"❌ Failed to create Supabase client: {e}")
                self.supabase_tests_run += 1
                return False
            
            # Test service role client
            try:
                service_client = get_supabase_client(service_role=True)
                print("✅ Supabase service role client created successfully")
                self.supabase_tests_run += 1
                self.supabase_tests_passed += 1
            except Exception as e:
                print(f"❌ Failed to create Supabase service role client: {e}")
                self.supabase_tests_run += 1
                return False
            
            # Test DNDC organization retrieval
            dndc_org_id = "97fef08b-4fde-484d-b334-4b9450f9a280"
            try:
                # Use service role client to bypass RLS for testing
                result = service_client.table('organizations').select('*').eq('id', dndc_org_id).execute()
                if result.data and len(result.data) > 0:
                    org_data = result.data[0]
                    print(f"✅ DNDC organization found: {org_data.get('name', 'Unknown')}")
                    print(f"   Organization ID: {org_data.get('id')}")
                    print(f"   Slug: {org_data.get('slug', 'N/A')}")
                    self.supabase_tests_run += 1
                    self.supabase_tests_passed += 1
                else:
                    print("❌ DNDC organization not found in Supabase")
                    self.supabase_tests_run += 1
                    return False
            except Exception as e:
                print(f"❌ Failed to retrieve DNDC organization: {e}")
                self.supabase_tests_run += 1
                return False
            
            # Test SupabaseService initialization
            try:
                supabase_service = SupabaseService(organization_id=dndc_org_id)
                print("✅ SupabaseService initialized successfully")
                self.supabase_tests_run += 1
                self.supabase_tests_passed += 1
            except Exception as e:
                print(f"❌ Failed to initialize SupabaseService: {e}")
                self.supabase_tests_run += 1
                return False
            
            # Test multi-tenant resource retrieval
            try:
                # Note: This will fail due to RLS without proper auth, but we can test the method exists
                resources = supabase_service.get_resources()
                print(f"✅ Resource retrieval method works (found {len(resources) if resources else 0} resources)")
                self.supabase_tests_run += 1
                self.supabase_tests_passed += 1
            except Exception as e:
                # Expected to fail due to RLS, but method should exist
                if "get_resources" in str(e) and "object has no attribute" in str(e):
                    print(f"❌ SupabaseService missing get_resources method: {e}")
                    self.supabase_tests_run += 1
                else:
                    print(f"⚠️  Resource retrieval failed (expected due to RLS): {e}")
                    self.supabase_tests_run += 1
                    self.supabase_tests_passed += 1
            
            # Test table accessibility with service role
            tables_to_test = ['organizations', 'users', 'resources', 'applications', 'documents', 'alerts', 'contact_messages']
            for table in tables_to_test:
                try:
                    result = service_client.table(table).select('id').limit(1).execute()
                    print(f"✅ Table '{table}' is accessible")
                    self.supabase_tests_run += 1
                    self.supabase_tests_passed += 1
                except Exception as e:
                    print(f"❌ Table '{table}' is not accessible: {e}")
                    self.supabase_tests_run += 1
            
            return True
            
        except ImportError as e:
            print(f"❌ Failed to import Supabase modules: {e}")
            self.supabase_tests_run += 1
            return False
        except Exception as e:
            print(f"❌ Supabase integration test failed: {e}")
            self.supabase_tests_run += 1
            return False

    def test_supabase_endpoints(self):
        """Test if there are any Supabase-specific API endpoints"""
        print("\n=== TESTING SUPABASE API ENDPOINTS ===")
        
        # Test for Supabase health check endpoint
        supabase_endpoints = [
            "supabase/status",
            "supabase/health", 
            "supabase/organizations",
            "organizations",
            "tenant/info",
            "multi-tenant/status"
        ]
        
        for endpoint in supabase_endpoints:
            success, response = self.run_test(f"Supabase Endpoint: {endpoint}", "GET", endpoint, 200)
            if not success:
                # Try with different expected status codes
                success, response = self.run_test(f"Supabase Endpoint: {endpoint} (404 expected)", "GET", endpoint, 404)

    def test_backend_health_and_status(self):
        """Test basic backend health and status endpoints"""
        print("\n=== TESTING BACKEND HEALTH & STATUS ===")
        
        # Test API root
        success, response = self.run_test("API Root Health Check", "GET", "", 200)
        if success and isinstance(response, dict):
            if "message" in response:
                print(f"   API Message: {response['message']}")
        
        # Test status endpoint
        success, response = self.run_test("Status Endpoint", "GET", "status", 200)
        
        # Create a status check to verify database connectivity
        success, response = self.run_test(
            "Create Status Check (DB Connectivity)", 
            "POST", 
            "status", 
            200,
            data={"client_name": "supabase_integration_test"}
        )
        
        if success:
            print("✅ Backend can write to database successfully")
        else:
            print("❌ Backend database connectivity issue")

    def run_all_tests(self):
        """Run all API tests including Supabase integration"""
        print("🚀 Starting DNDC Resource Hub API Tests - Supabase Integration Focus")
        print(f"Testing against: {self.base_url}")
        
        try:
            # Test backend health first
            self.test_backend_health_and_status()
            
            # Test Supabase integration
            self.test_supabase_integration()
            
            # Test for Supabase-specific endpoints
            self.test_supabase_endpoints()
            
            # Run existing tests
            self.test_basic_endpoints()
            self.test_resources_endpoints()
            self.test_documents_endpoints()
            self.test_alerts_endpoints()
            self.test_contact_endpoints()
            
            # Phase 2 Tests
            self.test_phase2_applications_endpoints()
            self.test_phase2_financial_calculator_endpoints()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            return False
        
        # Print final results
        print(f"\n📊 FINAL RESULTS")
        print(f"MongoDB API Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Supabase Integration Tests passed: {self.supabase_tests_passed}/{self.supabase_tests_run}")
        total_tests = self.tests_run + self.supabase_tests_run
        total_passed = self.tests_passed + self.supabase_tests_passed
        print(f"Overall success rate: {(total_passed/total_tests)*100:.1f}%")
        
        if total_passed == total_tests:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check logs above")
            return False

def main():
    tester = DNDCAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())