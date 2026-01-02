#!/bin/bash

# Test script for Recommendation Engine

BASE_URL="http://localhost:8000"

echo "🧪 Testing Recommendation Engine API"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo "Response: $BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Root Endpoint
echo "2️⃣  Testing Root Endpoint..."
ROOT_RESPONSE=$(curl -s "$BASE_URL/")
echo -e "${GREEN}✅ Root endpoint response:${NC}"
echo "$ROOT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ROOT_RESPONSE"
echo ""

# Test 3: Recommendations (requires user_id)
echo "3️⃣  Testing Recommendations Endpoint..."
echo -e "${YELLOW}⚠️  This requires a valid user_id from your database${NC}"
echo ""

# Check if user_id is provided as argument
if [ -z "$1" ]; then
    echo "Usage: ./test_service.sh [user_id]"
    echo ""
    echo "Example:"
    echo "  ./test_service.sh 123e4567-e89b-12d3-a456-426614174000"
    echo ""
    echo "To get a user_id, check your database:"
    echo "  psql -h localhost -U postgres -d crossfit_pro -c \"SELECT id FROM users LIMIT 1;\""
    echo ""
else
    USER_ID=$1
    echo "Testing with user_id: $USER_ID"
    REC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/recommendations" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\": \"$USER_ID\"}")
    
    HTTP_CODE=$(echo "$REC_RESPONSE" | tail -n1)
    BODY=$(echo "$REC_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Recommendations endpoint works!${NC}"
        echo "Response:"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}❌ Recommendations failed (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
fi

echo ""
echo "===================================="
echo "✅ Testing complete!"

