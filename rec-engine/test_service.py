#!/usr/bin/env python3
"""
Simple test script for Recommendation Engine API
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("1️⃣  Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print(f"❌ Health check failed (HTTP {response.status_code})")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to service. Is it running on port 8000?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_root():
    """Test root endpoint"""
    print("\n2️⃣  Testing Root Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Root endpoint works!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print(f"❌ Root endpoint failed (HTTP {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_recommendations(user_id):
    """Test recommendations endpoint"""
    print(f"\n3️⃣  Testing Recommendations Endpoint with user_id: {user_id}...")
    try:
        payload = {"user_id": user_id}
        response = requests.post(
            f"{BASE_URL}/recommendations",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Recommendations endpoint works!")
            data = response.json()
            print(f"\n📊 Recommendations Summary:")
            print(f"  - Existing routines: {len(data.get('existing_routines', []))}")
            print(f"  - New routines: {len(data.get('new_routines', []))}")
            print(f"\n📝 Full Response:")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"❌ Recommendations failed (HTTP {response.status_code})")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("🧪 Testing Recommendation Engine API")
    print("=" * 50)
    
    # Test health
    health_ok = test_health()
    if not health_ok:
        print("\n❌ Service is not running or not accessible.")
        print("Make sure the service is running: uvicorn app.main:app --reload --port 8000")
        sys.exit(1)
    
    # Test root
    test_root()
    
    # Test recommendations if user_id provided
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        test_recommendations(user_id)
    else:
        print("\n3️⃣  Skipping Recommendations Test (no user_id provided)")
        print("\n💡 To test recommendations, run:")
        print(f"   python test_service.py <user_id>")
        print("\n   Or use curl:")
        print(f'   curl -X POST {BASE_URL}/recommendations \\')
        print('     -H "Content-Type: application/json" \\')
        print('     -d \'{"user_id": "your-user-id"}\'')
    
    print("\n" + "=" * 50)
    print("✅ Testing complete!")


if __name__ == "__main__":
    main()

