import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path

class DNDCAPITester:
    def __init__(self, base_url="https://content-recovery-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.document_id = None

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

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting DNDC Resource Hub API Tests - Phase 2 Enhanced")
        print(f"Testing against: {self.base_url}")
        
        try:
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
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
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