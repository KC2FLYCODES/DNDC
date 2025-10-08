import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path

# Add backend directory to path for Supabase testing
sys.path.append('/app/backend')

class DNDCAPITester:
    def __init__(self, base_url="https://dndc-platform.preview.emergentagent.com"):
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
                # Note: This will test the method exists but won't actually call it since it's async
                supabase_service = SupabaseService(organization_id=dndc_org_id)
                if hasattr(supabase_service, 'get_resources'):
                    print(f"✅ SupabaseService has get_resources method")
                    self.supabase_tests_run += 1
                    self.supabase_tests_passed += 1
                else:
                    print(f"❌ SupabaseService missing get_resources method")
                    self.supabase_tests_run += 1
            except Exception as e:
                print(f"❌ Failed to test SupabaseService methods: {e}")
                self.supabase_tests_run += 1
            
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
        """Test the new Supabase multi-tenant API endpoints"""
        print("\n=== TESTING SUPABASE MULTI-TENANT API ENDPOINTS ===")
        
        # DNDC Organization ID
        dndc_org_id = "97fef08b-4fde-484d-b334-4b9450f9a280"
        
        # 1. Test Supabase Status Check
        print("\n--- Testing Supabase Status Check ---")
        success, response = self.run_test("Supabase Status Check", "GET", "supabase/status", 200)
        if success and response:
            print(f"   Supabase Status: {response.get('status', 'Unknown')}")
            if 'dndc_organization' in response:
                org_info = response['dndc_organization']
                print(f"   DNDC Org Name: {org_info.get('name', 'Unknown')}")
                print(f"   DNDC Org ID: {org_info.get('id', 'Unknown')}")
        
        # 2. Test Organization Endpoints
        print("\n--- Testing Organization Endpoints ---")
        success, response = self.run_test(
            "Get DNDC Organization", 
            "GET", 
            f"organizations/{dndc_org_id}", 
            200
        )
        if success and response:
            print(f"   Organization Name: {response.get('name', 'Unknown')}")
            print(f"   Organization Slug: {response.get('slug', 'Unknown')}")
        
        # 3. Test Multi-tenant Resource Endpoints
        print("\n--- Testing Multi-tenant Resource Endpoints ---")
        success, resources = self.run_test(
            "Get Organization Resources", 
            "GET", 
            f"organizations/{dndc_org_id}/resources", 
            200
        )
        if success:
            print(f"   Found {len(resources) if isinstance(resources, list) else 0} organization resources")
        
        # Test creating a resource for the organization
        test_resource_data = {
            "organization_id": dndc_org_id,
            "name": "Test Multi-tenant Resource",
            "description": "A test resource for multi-tenant functionality",
            "category": "housing",
            "phone": "434-555-TEST",
            "address": "123 Test Street, Danville, VA",
            "hours": "Mon-Fri 9am-5pm",
            "eligibility": "Test eligibility criteria"
        }
        
        success, response = self.run_test(
            "Create Organization Resource",
            "POST",
            f"organizations/{dndc_org_id}/resources",
            200,
            data=test_resource_data
        )
        if success and response:
            print(f"   Created resource with ID: {response.get('id', 'Unknown')}")
        
        # 4. Test DNDC Convenience Endpoints
        print("\n--- Testing DNDC Convenience Endpoints ---")
        
        # Test DNDC resources endpoint
        success, dndc_resources = self.run_test("Get DNDC Resources", "GET", "dndc/resources", 200)
        if success:
            print(f"   Found {len(dndc_resources) if isinstance(dndc_resources, list) else 0} DNDC resources")
        
        # Test DNDC applications endpoint
        success, dndc_applications = self.run_test("Get DNDC Applications", "GET", "dndc/applications", 200)
        if success:
            print(f"   Found {len(dndc_applications) if isinstance(dndc_applications, list) else 0} DNDC applications")
        
        # Test DNDC alerts endpoint
        success, dndc_alerts = self.run_test("Get DNDC Alerts", "GET", "dndc/alerts", 200)
        if success:
            print(f"   Found {len(dndc_alerts) if isinstance(dndc_alerts, list) else 0} DNDC alerts")
        
        # Test DNDC analytics endpoint
        success, dndc_analytics = self.run_test("Get DNDC Analytics", "GET", "dndc/analytics", 200)
        if success and dndc_analytics:
            print(f"   Analytics keys: {list(dndc_analytics.keys()) if isinstance(dndc_analytics, dict) else 'Invalid format'}")
        
        # 5. Test Multi-tenant Application Endpoints
        print("\n--- Testing Multi-tenant Application Endpoints ---")
        success, org_applications = self.run_test(
            "Get Organization Applications",
            "GET",
            f"organizations/{dndc_org_id}/applications",
            200
        )
        if success:
            print(f"   Found {len(org_applications) if isinstance(org_applications, list) else 0} organization applications")
        
        # Test creating an application for the organization
        test_application_data = {
            "organization_id": dndc_org_id,
            "applicant_name": "Test Multi-tenant Applicant",
            "applicant_email": "test.applicant@example.com",
            "applicant_phone": "434-555-TEST",
            "application_type": "mission_180"
        }
        
        success, response = self.run_test(
            "Create Organization Application",
            "POST",
            f"organizations/{dndc_org_id}/applications",
            200,
            data=test_application_data
        )
        if success and response:
            print(f"   Created application with ID: {response.get('id', 'Unknown')}")
            app_id = response.get('id')
            
            # Test updating application status
            if app_id:
                success, update_response = self.run_test(
                    "Update Application Status",
                    "PUT",
                    f"organizations/{dndc_org_id}/applications/{app_id}/status?status=under_review&notes=Test status update",
                    200
                )
                if success:
                    print(f"   Successfully updated application status")
        
        # 6. Test Resource Filtering and Search
        print("\n--- Testing Resource Filtering and Search ---")
        
        # Test category filtering
        success, housing_resources = self.run_test(
            "Get Housing Resources (Multi-tenant)",
            "GET",
            f"organizations/{dndc_org_id}/resources?category=housing",
            200
        )
        if success:
            print(f"   Found {len(housing_resources) if isinstance(housing_resources, list) else 0} housing resources")
        
        # Test search functionality
        success, search_results = self.run_test(
            "Search Resources (Multi-tenant)",
            "GET",
            f"organizations/{dndc_org_id}/resources?search=test",
            200
        )
        if success:
            print(f"   Found {len(search_results) if isinstance(search_results, list) else 0} resources matching 'test'")
        
        # 7. Test Error Handling
        print("\n--- Testing Error Handling ---")
        
        # Test with invalid organization ID
        invalid_org_id = "00000000-0000-0000-0000-000000000000"
        success, response = self.run_test(
            "Get Invalid Organization",
            "GET",
            f"organizations/{invalid_org_id}",
            404
        )
        if success:
            print("   ✅ Properly handles invalid organization ID")
        
        # Test with invalid organization resources
        success, response = self.run_test(
            "Get Resources for Invalid Organization",
            "GET",
            f"organizations/{invalid_org_id}/resources",
            500  # Expecting error due to invalid org
        )
        
        print("\n--- Supabase Multi-tenant Testing Complete ---")

    def test_cdc_program_management_endpoints(self):
        """Test the new CDC Program Management endpoints"""
        print("\n=== TESTING CDC PROGRAM MANAGEMENT ENDPOINTS ===")
        
        # DNDC Organization ID
        dndc_org_id = "97fef08b-4fde-484d-b334-4b9450f9a280"
        
        # 1. Test Programs CRUD Operations
        print("\n--- Testing Programs CRUD Operations ---")
        
        # Test GET /api/dndc/programs (should show Mission 180 program)
        success, programs = self.run_test("Get DNDC Programs", "GET", "dndc/programs", 200)
        program_id = None
        if success and programs:
            print(f"   Found {len(programs)} programs")
            # Look for Mission 180 program
            mission_180 = next((p for p in programs if 'Mission 180' in p.get('name', '')), None)
            if mission_180:
                print(f"   ✅ Mission 180 program found: {mission_180.get('name')}")
                program_id = mission_180.get('id')
            else:
                print("   ⚠️  Mission 180 program not found in results")
                # Use first program if available
                if programs:
                    program_id = programs[0].get('id')
        
        # Test GET /api/dndc/programs/{program_id} (get program details)
        if program_id:
            success, program_details = self.run_test(
                "Get Program Details", 
                "GET", 
                f"dndc/programs/{program_id}", 
                200
            )
            if success and program_details:
                print(f"   Program Name: {program_details.get('name', 'Unknown')}")
                print(f"   Program Type: {program_details.get('type', 'Unknown')}")
                print(f"   Program Status: {program_details.get('status', 'Unknown')}")
        
        # Test POST /api/dndc/programs (create new program)
        test_program_data = {
            "name": "Test Housing Program",
            "description": "A test housing assistance program for API testing",
            "type": "housing_assistance",
            "status": "active",
            "eligibility_criteria": {
                "income_limit": "80% AMI",
                "household_size": "1-8 members",
                "residency": "Danville, VA area"
            },
            "financial_terms": {
                "max_assistance": 5000,
                "assistance_type": "grant",
                "repayment_required": False
            },
            "application_deadline": "2024-12-31T23:59:59Z",
            "faqs": [
                {
                    "question": "Who is eligible?",
                    "answer": "Households earning 80% or less of Area Median Income"
                }
            ]
        }
        
        success, new_program = self.run_test(
            "Create New Program",
            "POST",
            "dndc/programs",
            200,
            data=test_program_data
        )
        
        created_program_id = None
        if success and new_program:
            created_program_id = new_program.get('id')
            print(f"   Created program with ID: {created_program_id}")
            print(f"   Program Name: {new_program.get('name')}")
        
        # Test PUT /api/dndc/programs/{program_id} (update program)
        if created_program_id:
            update_data = {
                "description": "Updated test housing assistance program description",
                "status": "active",
                "financial_terms": {
                    "max_assistance": 7500,
                    "assistance_type": "grant",
                    "repayment_required": False
                }
            }
            
            success, updated_program = self.run_test(
                "Update Program",
                "PUT",
                f"dndc/programs/{created_program_id}",
                200,
                data=update_data
            )
            
            if success and updated_program:
                print(f"   Updated program successfully")
                print(f"   New max assistance: {updated_program.get('financial_terms', {}).get('max_assistance', 'Unknown')}")
        
        # 2. Test Multi-tenant Organization Programs Endpoints
        print("\n--- Testing Multi-tenant Organization Programs ---")
        
        # Test GET /api/organizations/{org_id}/programs
        success, org_programs = self.run_test(
            "Get Organization Programs",
            "GET",
            f"organizations/{dndc_org_id}/programs",
            200
        )
        
        if success and org_programs:
            print(f"   Found {len(org_programs)} organization programs")
            # Use first program for application testing
            if org_programs:
                test_program_id = org_programs[0].get('id')
                
                # 3. Test Program Applications
                print("\n--- Testing Program Applications ---")
                
                # Test GET /api/organizations/{org_id}/programs/{program_id}/applications
                success, applications = self.run_test(
                    "Get Program Applications",
                    "GET",
                    f"organizations/{dndc_org_id}/programs/{test_program_id}/applications",
                    200
                )
                
                if success:
                    print(f"   Found {len(applications) if isinstance(applications, list) else 0} applications for program")
                
                # Test POST /api/organizations/{org_id}/programs/{program_id}/applications
                application_data = {
                    "applicant_name": "Sarah Johnson",
                    "applicant_email": "sarah.johnson@email.com",
                    "applicant_phone": "434-555-0123",
                    "form_data": {
                        "household_size": 3,
                        "annual_income": 45000,
                        "current_address": "123 Main St, Danville, VA",
                        "housing_situation": "Renting",
                        "assistance_needed": "Down payment assistance"
                    }
                }
                
                success, new_application = self.run_test(
                    "Submit Program Application",
                    "POST",
                    f"organizations/{dndc_org_id}/programs/{test_program_id}/applications",
                    200,
                    data=application_data
                )
                
                if success and new_application:
                    app_id = new_application.get('id')
                    print(f"   Submitted application with ID: {app_id}")
                    print(f"   Applicant: {new_application.get('applicant_name')}")
                    print(f"   Status: {new_application.get('status')}")
                    
                    # Test updating application status
                    if app_id:
                        update_data = {
                            "status": "under_review",
                            "review_notes": "Application received and under initial review"
                        }
                        
                        success, updated_app = self.run_test(
                            "Update Application Status",
                            "PUT",
                            f"organizations/{dndc_org_id}/programs/{test_program_id}/applications/{app_id}",
                            200,
                            data=update_data
                        )
                        
                        if success:
                            print(f"   Updated application status to: {updated_app.get('status', 'Unknown')}")
        
        # 4. Test Dashboard Analytics
        print("\n--- Testing Dashboard Analytics ---")
        
        # Test GET /api/dndc/programs-dashboard
        success, dashboard = self.run_test(
            "Get Programs Dashboard",
            "GET",
            "dndc/programs-dashboard",
            200
        )
        
        if success and dashboard:
            print(f"   Total Programs: {dashboard.get('total_programs', 0)}")
            print(f"   Active Programs: {dashboard.get('active_programs', 0)}")
            print(f"   Total Applications: {dashboard.get('total_applications', 0)}")
            print(f"   Pending Applications: {dashboard.get('pending_applications', 0)}")
            print(f"   Approved Applications: {dashboard.get('approved_applications', 0)}")
        
        # Test organization-specific dashboard
        success, org_dashboard = self.run_test(
            "Get Organization Programs Dashboard",
            "GET",
            f"organizations/{dndc_org_id}/programs-dashboard",
            200
        )
        
        if success and org_dashboard:
            print(f"   Organization Dashboard - Total Programs: {org_dashboard.get('total_programs', 0)}")
            print(f"   Organization Dashboard - Active Programs: {org_dashboard.get('active_programs', 0)}")
        
        # 5. Test Data Validation and Error Handling
        print("\n--- Testing Data Validation and Error Handling ---")
        
        # Test creating program with invalid data
        invalid_program_data = {
            "name": "",  # Empty name should fail
            "type": "invalid_type"
        }
        
        success, response = self.run_test(
            "Create Program with Invalid Data",
            "POST",
            "dndc/programs",
            400,  # Expecting validation error
            data=invalid_program_data
        )
        
        if success:
            print("   ✅ Properly validates program data")
        
        # Test accessing non-existent program
        fake_program_id = "00000000-0000-0000-0000-000000000000"
        success, response = self.run_test(
            "Get Non-existent Program",
            "GET",
            f"dndc/programs/{fake_program_id}",
            404
        )
        
        if success:
            print("   ✅ Properly handles non-existent program requests")
        
        # Test submitting application to non-existent program
        success, response = self.run_test(
            "Submit Application to Non-existent Program",
            "POST",
            f"organizations/{dndc_org_id}/programs/{fake_program_id}/applications",
            404,
            data=application_data
        )
        
        if success:
            print("   ✅ Properly handles applications to non-existent programs")
        
        print("\n--- CDC Program Management Testing Complete ---")

    def test_property_management_endpoints(self):
        """Test the new Property Management API endpoints"""
        print("\n=== TESTING PROPERTY MANAGEMENT API ENDPOINTS ===")
        
        # 1. Test GET /api/properties (should return 5 sample properties)
        print("\n--- Testing Property CRUD Operations ---")
        success, properties = self.run_test("Get All Properties", "GET", "properties", 200)
        property_id = None
        if success and properties:
            print(f"   Found {len(properties)} properties")
            if len(properties) >= 5:
                print("   ✅ Expected 5 sample properties found")
            else:
                print(f"   ⚠️  Expected 5 properties, found {len(properties)}")
            property_id = properties[0].get('id') if properties else None
        
        # 2. Test GET /api/properties with filters
        print("\n--- Testing Property Filtering ---")
        
        # Test status filter
        success, available_properties = self.run_test(
            "Get Available Properties", 
            "GET", 
            "properties?status=available", 
            200
        )
        if success:
            print(f"   Found {len(available_properties) if isinstance(available_properties, list) else 0} available properties")
        
        # Test property type filter
        success, single_family = self.run_test(
            "Get Single Family Properties", 
            "GET", 
            "properties?property_type=single_family", 
            200
        )
        if success:
            print(f"   Found {len(single_family) if isinstance(single_family, list) else 0} single family properties")
        
        # Test bedrooms filter
        success, three_bedroom = self.run_test(
            "Get 3-Bedroom Properties", 
            "GET", 
            "properties?bedrooms=3", 
            200
        )
        if success:
            print(f"   Found {len(three_bedroom) if isinstance(three_bedroom, list) else 0} 3-bedroom properties")
        
        # Test combined filters
        success, filtered_properties = self.run_test(
            "Get Filtered Properties (status=available, property_type=single_family, bedrooms=3)", 
            "GET", 
            "properties?status=available&property_type=single_family&bedrooms=3", 
            200
        )
        if success:
            print(f"   Found {len(filtered_properties) if isinstance(filtered_properties, list) else 0} properties matching all filters")
        
        # 3. Test GET /api/properties/{property_id}
        if property_id:
            success, property_details = self.run_test(
                "Get Property Details", 
                "GET", 
                f"properties/{property_id}", 
                200
            )
            if success and property_details:
                print(f"   Property Title: {property_details.get('title', 'Unknown')}")
                print(f"   Property Type: {property_details.get('property_type', 'Unknown')}")
                print(f"   Bedrooms: {property_details.get('bedrooms', 'Unknown')}")
                print(f"   Status: {property_details.get('status', 'Unknown')}")
        
        # 4. Test POST /api/properties (create new property)
        print("\n--- Testing Property Creation ---")
        test_property_data = {
            "title": "Test Property - API Testing",
            "description": "A test property created during API testing",
            "address": "456 Test Avenue",
            "city": "Danville",
            "state": "VA",
            "zip_code": "24541",
            "property_type": "single_family",
            "bedrooms": 3,
            "bathrooms": 2.0,
            "square_feet": 1500,
            "price": 125000,
            "status": "available",
            "latitude": 36.585901,
            "longitude": -79.395096,
            "features": ["Test Feature 1", "Test Feature 2"],
            "contact_name": "Test Contact",
            "contact_phone": "434-555-TEST",
            "contact_email": "test@dndcva.org",
            "program_type": "test_program"
        }
        
        success, new_property = self.run_test(
            "Create New Property",
            "POST",
            "properties",
            200,
            data=test_property_data
        )
        
        created_property_id = None
        if success and new_property:
            created_property_id = new_property.get('id')
            print(f"   Created property with ID: {created_property_id}")
            print(f"   Property Title: {new_property.get('title')}")
        
        # 5. Test PUT /api/properties/{property_id} (update property status)
        if created_property_id:
            print("\n--- Testing Property Updates ---")
            update_data = {
                "status": "pending",
                "description": "Updated test property - status changed to pending"
            }
            
            success, updated_property = self.run_test(
                "Update Property Status to Pending",
                "PUT",
                f"properties/{created_property_id}",
                200,
                data=update_data
            )
            
            if success and updated_property:
                print(f"   Updated property status to: {updated_property.get('status')}")
        
        # 6. Test DELETE /api/properties/{property_id}
        if created_property_id:
            print("\n--- Testing Property Deletion ---")
            success, response = self.run_test(
                "Delete Property",
                "DELETE",
                f"properties/{created_property_id}",
                200
            )
            
            if success:
                print("   ✅ Property deleted successfully")
                
                # Verify deletion by trying to get the property
                success, response = self.run_test(
                    "Verify Property Deletion",
                    "GET",
                    f"properties/{created_property_id}",
                    404
                )
                
                if success:
                    print("   ✅ Property deletion verified (404 returned)")
        
        # 7. Test error handling
        print("\n--- Testing Property Error Handling ---")
        
        # Test getting non-existent property
        fake_property_id = "00000000-0000-0000-0000-000000000000"
        success, response = self.run_test(
            "Get Non-existent Property",
            "GET",
            f"properties/{fake_property_id}",
            404
        )
        
        if success:
            print("   ✅ Properly handles non-existent property requests")
        
        print("\n--- Property Management Testing Complete ---")

    def test_community_board_endpoints(self):
        """Test the new Community Board API endpoints"""
        print("\n=== TESTING COMMUNITY BOARD API ENDPOINTS ===")
        
        # 1. SUCCESS STORIES TESTING
        print("\n--- Testing Success Stories ---")
        
        # Test GET /api/success-stories (should return 3 sample stories)
        success, stories = self.run_test("Get All Success Stories", "GET", "success-stories", 200)
        story_id = None
        if success and stories:
            print(f"   Found {len(stories)} success stories")
            if len(stories) >= 3:
                print("   ✅ Expected 3 sample stories found")
            else:
                print(f"   ⚠️  Expected 3 stories, found {len(stories)}")
            story_id = stories[0].get('id') if stories else None
        
        # Test GET /api/success-stories?featured_only=true
        success, featured_stories = self.run_test(
            "Get Featured Success Stories", 
            "GET", 
            "success-stories?featured_only=true", 
            200
        )
        if success:
            print(f"   Found {len(featured_stories) if isinstance(featured_stories, list) else 0} featured stories")
        
        # Test POST /api/success-stories (create new story)
        test_story_data = {
            "title": "Test Success Story - API Testing",
            "resident_name": "Test Resident",
            "story_text": "This is a test success story created during API testing. It demonstrates the API functionality for creating new success stories.",
            "program_name": "Test Program",
            "is_featured": False
        }
        
        success, new_story = self.run_test(
            "Create New Success Story",
            "POST",
            "success-stories",
            200,
            data=test_story_data
        )
        
        created_story_id = None
        if success and new_story:
            created_story_id = new_story.get('id')
            print(f"   Created story with ID: {created_story_id}")
        
        # Test PUT /api/success-stories/{story_id} (update story)
        if created_story_id:
            update_data = {
                "title": "Updated Test Success Story",
                "is_featured": True,
                "story_text": "This story has been updated during API testing."
            }
            
            success, updated_story = self.run_test(
                "Update Success Story",
                "PUT",
                f"success-stories/{created_story_id}",
                200,
                data=update_data
            )
            
            if success:
                print(f"   Updated story - Featured: {updated_story.get('is_featured', False)}")
        
        # Test DELETE /api/success-stories/{story_id}
        if created_story_id:
            success, response = self.run_test(
                "Delete Success Story",
                "DELETE",
                f"success-stories/{created_story_id}",
                200
            )
            
            if success:
                print("   ✅ Success story deleted successfully")
        
        # 2. COMMUNITY EVENTS TESTING
        print("\n--- Testing Community Events ---")
        
        # Test GET /api/community-events (should return 3 sample events)
        success, events = self.run_test("Get All Community Events", "GET", "community-events", 200)
        event_id = None
        if success and events:
            print(f"   Found {len(events)} community events")
            if len(events) >= 3:
                print("   ✅ Expected 3 sample events found")
            else:
                print(f"   ⚠️  Expected 3 events, found {len(events)}")
            event_id = events[0].get('id') if events else None
        
        # Test GET /api/community-events?upcoming_only=true
        success, upcoming_events = self.run_test(
            "Get Upcoming Community Events", 
            "GET", 
            "community-events?upcoming_only=true", 
            200
        )
        if success:
            print(f"   Found {len(upcoming_events) if isinstance(upcoming_events, list) else 0} upcoming events")
        
        # Test GET /api/community-events/{event_id}
        if event_id:
            success, event_details = self.run_test(
                "Get Event Details", 
                "GET", 
                f"community-events/{event_id}", 
                200
            )
            if success and event_details:
                print(f"   Event Title: {event_details.get('title', 'Unknown')}")
                print(f"   Event Type: {event_details.get('event_type', 'Unknown')}")
        
        # Test POST /api/community-events (create new event with future date)
        from datetime import datetime, timedelta
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
        
        test_event_data = {
            "title": "Test Community Event - API Testing",
            "description": "A test community event created during API testing",
            "event_date": future_date,
            "location": "Test Location, Danville, VA",
            "event_type": "workshop",
            "organizer": "DNDC Test",
            "contact_email": "test@dndcva.org",
            "registration_required": True,
            "max_attendees": 25
        }
        
        success, new_event = self.run_test(
            "Create New Community Event",
            "POST",
            "community-events",
            200,
            data=test_event_data
        )
        
        created_event_id = None
        if success and new_event:
            created_event_id = new_event.get('id')
            print(f"   Created event with ID: {created_event_id}")
        
        # Test POST /api/community-events/{event_id}/register (register for event)
        if created_event_id:
            success, response = self.run_test(
                "Register for Event",
                "POST",
                f"community-events/{created_event_id}/register",
                200
            )
            
            if success:
                print("   ✅ Event registration successful")
        
        # Test PUT /api/community-events/{event_id} (update event)
        if created_event_id:
            update_data = {
                "title": "Updated Test Community Event",
                "description": "This event has been updated during API testing",
                "max_attendees": 30
            }
            
            success, updated_event = self.run_test(
                "Update Community Event",
                "PUT",
                f"community-events/{created_event_id}",
                200,
                data=update_data
            )
            
            if success:
                print(f"   Updated event - Max Attendees: {updated_event.get('max_attendees', 0)}")
        
        # Test DELETE /api/community-events/{event_id}
        if created_event_id:
            success, response = self.run_test(
                "Delete Community Event",
                "DELETE",
                f"community-events/{created_event_id}",
                200
            )
            
            if success:
                print("   ✅ Community event deleted successfully")
        
        # 3. TESTIMONIALS TESTING
        print("\n--- Testing Testimonials ---")
        
        # Test GET /api/testimonials (should return 4 sample testimonials, approved only)
        success, testimonials = self.run_test("Get All Testimonials", "GET", "testimonials", 200)
        testimonial_id = None
        if success and testimonials:
            print(f"   Found {len(testimonials)} testimonials")
            if len(testimonials) >= 4:
                print("   ✅ Expected 4 sample testimonials found")
            else:
                print(f"   ⚠️  Expected 4 testimonials, found {len(testimonials)}")
            
            # Check if all returned testimonials are approved
            approved_count = sum(1 for t in testimonials if t.get('is_approved', False))
            print(f"   Approved testimonials: {approved_count}/{len(testimonials)}")
            
            testimonial_id = testimonials[0].get('id') if testimonials else None
        
        # Test POST /api/testimonials (submit new testimonial)
        test_testimonial_data = {
            "resident_name": "Test Resident",
            "testimonial_text": "This is a test testimonial created during API testing. The DNDC services have been excellent!",
            "program_name": "Test Program",
            "rating": 5
        }
        
        success, new_testimonial = self.run_test(
            "Submit New Testimonial",
            "POST",
            "testimonials",
            200,
            data=test_testimonial_data
        )
        
        created_testimonial_id = None
        if success and new_testimonial:
            created_testimonial_id = new_testimonial.get('id')
            print(f"   Created testimonial with ID: {created_testimonial_id}")
            print(f"   Approval Status: {new_testimonial.get('is_approved', False)}")
        
        # Test PUT /api/testimonials/{testimonial_id}/approve (approve testimonial)
        if created_testimonial_id:
            success, response = self.run_test(
                "Approve Testimonial",
                "PUT",
                f"testimonials/{created_testimonial_id}/approve",
                200
            )
            
            if success:
                print("   ✅ Testimonial approved successfully")
        
        # Test DELETE /api/testimonials/{testimonial_id}
        if created_testimonial_id:
            success, response = self.run_test(
                "Delete Testimonial",
                "DELETE",
                f"testimonials/{created_testimonial_id}",
                200
            )
            
            if success:
                print("   ✅ Testimonial deleted successfully")
        
        # 4. Test error handling
        print("\n--- Testing Community Board Error Handling ---")
        
        # Test getting non-existent story
        fake_id = "00000000-0000-0000-0000-000000000000"
        success, response = self.run_test(
            "Get Non-existent Success Story",
            "GET",
            f"success-stories/{fake_id}",
            404
        )
        
        if success:
            print("   ✅ Properly handles non-existent success story requests")
        
        print("\n--- Community Board Testing Complete ---")

    def test_smart_notifications_endpoints(self):
        """Test the new Smart Notifications API endpoints"""
        print("\n=== TESTING SMART NOTIFICATIONS API ENDPOINTS ===")
        
        # 1. NOTIFICATIONS TESTING
        print("\n--- Testing Notifications ---")
        
        # Test GET /api/notifications (should return 4 sample notifications)
        success, notifications = self.run_test("Get All Notifications", "GET", "notifications", 200)
        notification_id = None
        if success and notifications:
            print(f"   Found {len(notifications)} notifications")
            if len(notifications) >= 4:
                print("   ✅ Expected 4 sample notifications found")
            else:
                print(f"   ⚠️  Expected 4 notifications, found {len(notifications)}")
            notification_id = notifications[0].get('id') if notifications else None
            
            # Check notification types and priorities
            types = [n.get('notification_type') for n in notifications]
            priorities = [n.get('priority') for n in notifications]
            print(f"   Notification types found: {set(types)}")
            print(f"   Priority levels found: {set(priorities)}")
        
        # Test GET /api/notifications?unread_only=true
        success, unread_notifications = self.run_test(
            "Get Unread Notifications", 
            "GET", 
            "notifications?unread_only=true", 
            200
        )
        if success:
            print(f"   Found {len(unread_notifications) if isinstance(unread_notifications, list) else 0} unread notifications")
        
        # Test GET /api/notifications/unread-count
        success, unread_count = self.run_test(
            "Get Unread Count", 
            "GET", 
            "notifications/unread-count", 
            200
        )
        if success and unread_count:
            print(f"   Unread count: {unread_count.get('count', 0)}")
        
        # Test POST /api/notifications (create new notification)
        test_notification_data = {
            "notification_type": "property_alert",
            "title": "Test Property Alert - API Testing",
            "message": "A new test property has been added to the system during API testing",
            "priority": "high",
            "related_item_type": "property"
        }
        
        success, new_notification = self.run_test(
            "Create New Notification",
            "POST",
            "notifications",
            200,
            data=test_notification_data
        )
        
        created_notification_id = None
        if success and new_notification:
            created_notification_id = new_notification.get('id')
            print(f"   Created notification with ID: {created_notification_id}")
            print(f"   Notification Type: {new_notification.get('notification_type')}")
            print(f"   Priority: {new_notification.get('priority')}")
        
        # Test PUT /api/notifications/{notification_id}/read (mark as read)
        if created_notification_id:
            success, response = self.run_test(
                "Mark Notification as Read",
                "PUT",
                f"notifications/{created_notification_id}/read",
                200
            )
            
            if success:
                print("   ✅ Notification marked as read successfully")
        
        # Test PUT /api/notifications/mark-all-read?user_id=test_user
        success, response = self.run_test(
            "Mark All Notifications as Read",
            "PUT",
            "notifications/mark-all-read?user_id=test_user",
            200
        )
        
        if success:
            print("   ✅ All notifications marked as read successfully")
        
        # Test DELETE /api/notifications/{notification_id}
        if created_notification_id:
            success, response = self.run_test(
                "Delete Notification",
                "DELETE",
                f"notifications/{created_notification_id}",
                200
            )
            
            if success:
                print("   ✅ Notification deleted successfully")
        
        # 2. NOTIFICATION PREFERENCES TESTING
        print("\n--- Testing Notification Preferences ---")
        
        test_user_id = "test_user"
        
        # Test GET /api/notification-preferences/test_user (should return default preferences)
        success, preferences = self.run_test(
            "Get User Notification Preferences", 
            "GET", 
            f"notification-preferences/{test_user_id}", 
            200
        )
        if success and preferences:
            print(f"   User ID: {preferences.get('user_id')}")
            print(f"   Deadline Reminders: {preferences.get('deadline_reminders', False)}")
            print(f"   Property Alerts: {preferences.get('property_alerts', False)}")
            print(f"   Program Updates: {preferences.get('program_updates', False)}")
            print(f"   General Announcements: {preferences.get('general_announcements', False)}")
        
        # Test PUT /api/notification-preferences/test_user (update preferences)
        update_preferences_data = {
            "deadline_reminders": False,
            "property_alerts": True,
            "program_updates": True,
            "general_announcements": False,
            "email_notifications": True,
            "sms_notifications": False
        }
        
        success, updated_preferences = self.run_test(
            "Update User Notification Preferences",
            "PUT",
            f"notification-preferences/{test_user_id}",
            200,
            data=update_preferences_data
        )
        
        if success and updated_preferences:
            print(f"   Updated Deadline Reminders: {updated_preferences.get('deadline_reminders', False)}")
            print(f"   Updated Email Notifications: {updated_preferences.get('email_notifications', False)}")
        
        # 3. Test notification filtering by user
        print("\n--- Testing User-Specific Notifications ---")
        
        # Create a user-specific notification
        user_notification_data = {
            "user_id": test_user_id,
            "notification_type": "deadline_reminder",
            "title": "Personal Deadline Reminder - API Testing",
            "message": "This is a user-specific notification created during API testing",
            "priority": "normal"
        }
        
        success, user_notification = self.run_test(
            "Create User-Specific Notification",
            "POST",
            "notifications",
            200,
            data=user_notification_data
        )
        
        if success and user_notification:
            print(f"   Created user-specific notification for: {user_notification.get('user_id')}")
        
        # Test getting notifications for specific user
        success, user_notifications = self.run_test(
            "Get User-Specific Notifications",
            "GET",
            f"notifications?user_id={test_user_id}",
            200
        )
        
        if success:
            print(f"   Found {len(user_notifications) if isinstance(user_notifications, list) else 0} notifications for user")
        
        # 4. Test error handling
        print("\n--- Testing Smart Notifications Error Handling ---")
        
        # Test getting non-existent notification
        fake_notification_id = "00000000-0000-0000-0000-000000000000"
        success, response = self.run_test(
            "Get Non-existent Notification",
            "GET",
            f"notifications/{fake_notification_id}",
            404
        )
        
        if success:
            print("   ✅ Properly handles non-existent notification requests")
        
        # Test getting preferences for non-existent user
        success, response = self.run_test(
            "Get Preferences for Non-existent User",
            "GET",
            "notification-preferences/nonexistent_user",
            200  # Should return default preferences
        )
        
        if success:
            print("   ✅ Properly handles preferences for new users (returns defaults)")
        
        print("\n--- Smart Notifications Testing Complete ---")

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
        print("🚀 Starting DNDC Resource Hub API Tests - Supabase Multi-tenant Integration Focus")
        print(f"Testing against: {self.base_url}")
        
        try:
            # Test backend health first
            self.test_backend_health_and_status()
            
            # PRIORITY: Test new Supabase multi-tenant endpoints
            self.test_supabase_endpoints()
            
            # PRIORITY: Test new CDC Program Management endpoints
            self.test_cdc_program_management_endpoints()
            
            # Test Supabase integration layer
            self.test_supabase_integration()
            
            # Run existing MongoDB tests to ensure compatibility
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