#!/usr/bin/env python3
"""
Focused test for Phase 3 features: Property Management, Community Board, and Smart Notifications
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class Phase3Tester:
    def __init__(self, base_url="https://dndc-platform.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if data else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
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

    def test_community_board_fixes(self):
        """Test the fixed Community Board endpoints"""
        print("\n=== TESTING COMMUNITY BOARD FIXES ===")
        
        # Test individual success story GET (should now work)
        success, stories = self.run_test("Get All Success Stories", "GET", "success-stories", 200)
        if success and stories:
            story_id = stories[0].get('id')
            
            # Test GET individual story (new endpoint)
            success, story = self.run_test(
                "Get Individual Success Story", 
                "GET", 
                f"success-stories/{story_id}", 
                200
            )
            
            if success:
                print(f"   Story Title: {story.get('title', 'Unknown')}")
        
        # Test partial update for success story (should now work)
        success, new_story = self.run_test(
            "Create Test Success Story",
            "POST",
            "success-stories",
            200,
            data={
                "title": "Test Story for Update",
                "resident_name": "Test Resident",
                "story_text": "Original story text",
                "is_featured": False
            }
        )
        
        if success and new_story:
            story_id = new_story.get('id')
            
            # Test partial update (should now work with SuccessStoryUpdate model)
            success, updated_story = self.run_test(
                "Partial Update Success Story",
                "PUT",
                f"success-stories/{story_id}",
                200,
                data={
                    "title": "Updated Test Story",
                    "is_featured": True
                    # Note: Not including all required fields - this should work now
                }
            )
            
            if success:
                print(f"   Updated Title: {updated_story.get('title')}")
                print(f"   Updated Featured: {updated_story.get('is_featured')}")
            
            # Clean up
            self.run_test("Delete Test Story", "DELETE", f"success-stories/{story_id}", 200)
        
        # Test community events partial update
        future_date = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
        success, new_event = self.run_test(
            "Create Test Community Event",
            "POST",
            "community-events",
            200,
            data={
                "title": "Test Event for Update",
                "description": "Original description",
                "event_date": future_date,
                "location": "Test Location",
                "event_type": "workshop",
                "max_attendees": 20
            }
        )
        
        if success and new_event:
            event_id = new_event.get('id')
            
            # Test partial update (should now work)
            success, updated_event = self.run_test(
                "Partial Update Community Event",
                "PUT",
                f"community-events/{event_id}",
                200,
                data={
                    "title": "Updated Test Event",
                    "max_attendees": 30
                    # Note: Not including all required fields - this should work now
                }
            )
            
            if success:
                print(f"   Updated Title: {updated_event.get('title')}")
                print(f"   Updated Max Attendees: {updated_event.get('max_attendees')}")
            
            # Clean up
            self.run_test("Delete Test Event", "DELETE", f"community-events/{event_id}", 200)

    def test_smart_notifications_fixes(self):
        """Test the fixed Smart Notifications endpoints"""
        print("\n=== TESTING SMART NOTIFICATIONS FIXES ===")
        
        # Test individual notification GET (should now work)
        success, notifications = self.run_test("Get All Notifications", "GET", "notifications", 200)
        if success and notifications:
            notification_id = notifications[0].get('id')
            
            # Test GET individual notification (new endpoint)
            success, notification = self.run_test(
                "Get Individual Notification", 
                "GET", 
                f"notifications/{notification_id}", 
                200
            )
            
            if success:
                print(f"   Notification Title: {notification.get('title', 'Unknown')}")
                print(f"   Notification Type: {notification.get('notification_type', 'Unknown')}")

    def test_error_handling_fixes(self):
        """Test that error handling now returns proper 404s"""
        print("\n=== TESTING ERROR HANDLING FIXES ===")
        
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        # Test non-existent success story (should now return 404)
        success, response = self.run_test(
            "Get Non-existent Success Story",
            "GET",
            f"success-stories/{fake_id}",
            404
        )
        
        if success:
            print("   ✅ Properly returns 404 for non-existent success story")
        
        # Test non-existent notification (should now return 404)
        success, response = self.run_test(
            "Get Non-existent Notification",
            "GET",
            f"notifications/{fake_id}",
            404
        )
        
        if success:
            print("   ✅ Properly returns 404 for non-existent notification")

    def run_focused_tests(self):
        """Run focused tests on the fixes"""
        print("🚀 Testing Phase 3 Feature Fixes")
        print(f"Testing against: {self.base_url}")
        
        try:
            self.test_community_board_fixes()
            self.test_smart_notifications_fixes()
            self.test_error_handling_fixes()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            return False
        
        # Print results
        print(f"\n📊 FOCUSED TEST RESULTS")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed/self.tests_run)*100 if self.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All focused tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check logs above")
            return False

def main():
    tester = Phase3Tester()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())