#!/bin/bash

# AI Infrastructure Test Script
# Quickly test all AI endpoints

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api"

echo "🤖 AI Infrastructure Test Suite"
echo "================================"
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "${YELLOW}⚠️  No authentication token provided${NC}"
    echo "Usage: ./test-ai.sh YOUR_JWT_TOKEN"
    echo ""
    echo "Or run without token to test public endpoints only:"
    echo "./test-ai.sh"
    echo ""
    TOKEN=""
else
    TOKEN="$1"
    echo "${GREEN}✅ Using provided token${NC}"
fi

echo ""

# Test 1: Provider Status (Public endpoint)
echo "Test 1: Provider Status"
echo "----------------------"
response=$(curl -s "$API_URL/ai/test/providers/status")
echo "$response" | jq '.'
if echo "$response" | jq -e '.providers.openai.available' > /dev/null; then
    echo "${GREEN}✅ OpenAI available${NC}"
else
    echo "${RED}❌ OpenAI not available${NC}"
fi
if echo "$response" | jq -e '.providers.gemini.available' > /dev/null; then
    echo "${GREEN}✅ Gemini available${NC}"
else
    echo "${YELLOW}⚠️  Gemini not available (optional)${NC}"
fi
echo ""

if [ -z "$TOKEN" ]; then
    echo "${YELLOW}Skipping authenticated tests (no token provided)${NC}"
    echo ""
    echo "To run all tests:"
    echo "1. Get a token: curl -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"your@email.com\",\"password\":\"yourpass\"}'"
    echo "2. Run: ./test-ai.sh YOUR_TOKEN"
    exit 0
fi

# Test 2: Simple Completion
echo "Test 2: Simple Text Completion"
echo "------------------------------"
response=$(curl -s -X POST "$API_URL/ai/test/completion/simple" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"prompt":"What is CrossFit in one sentence?"}')
echo "$response" | jq '.'
if echo "$response" | jq -e '.success' > /dev/null; then
    echo "${GREEN}✅ Completion successful${NC}"
    tokens=$(echo "$response" | jq -r '.response.tokensUsed')
    provider=$(echo "$response" | jq -r '.response.provider')
    echo "  Provider: $provider, Tokens: $tokens"
else
    echo "${RED}❌ Completion failed${NC}"
fi
echo ""

# Test 3: Structured Output
echo "Test 3: Structured JSON Output"
echo "------------------------------"
response=$(curl -s -X POST "$API_URL/ai/test/completion/structured" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
echo "$response" | jq '.'
if echo "$response" | jq -e '.success' > /dev/null; then
    echo "${GREEN}✅ Structured output successful${NC}"
    exercises=$(echo "$response" | jq -r '.response.data.exercises | length')
    echo "  Generated $exercises exercises"
else
    echo "${RED}❌ Structured output failed${NC}"
fi
echo ""

# Test 4: Rate Limit Status
echo "Test 4: Rate Limit Status"
echo "-------------------------"
response=$(curl -s "$API_URL/ai/test/rate-limit/status" \
    -H "Authorization: Bearer $TOKEN")
echo "$response" | jq '.'
remaining=$(echo "$response" | jq -r '.currentStatus.remaining')
limit=$(echo "$response" | jq -r '.currentStatus.limit')
echo "${GREEN}✅ Rate limit: $remaining/$limit remaining${NC}"
echo ""

# Test 5: Cache Test (First call)
echo "Test 5: Cache Test (First Call)"
echo "-------------------------------"
start_time=$(date +%s%3N)
response=$(curl -s -X POST "$API_URL/ai/test/cache/test" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
end_time=$(date +%s%3N)
duration=$((end_time - start_time))
echo "$response" | jq '.'
cached=$(echo "$response" | jq -r '.cached')
if [ "$cached" == "false" ]; then
    echo "${GREEN}✅ Fresh response generated${NC}"
    echo "  Duration: ${duration}ms"
else
    echo "${YELLOW}⚡ Response from cache${NC}"
fi
echo ""

# Test 6: Cache Test (Second call - should be cached)
echo "Test 6: Cache Test (Second Call - Should Be Instant)"
echo "----------------------------------------------------"
start_time=$(date +%s%3N)
response=$(curl -s -X POST "$API_URL/ai/test/cache/test" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
end_time=$(date +%s%3N)
duration=$((end_time - start_time))
echo "$response" | jq '.'
cached=$(echo "$response" | jq -r '.cached')
if [ "$cached" == "true" ]; then
    echo "${GREEN}✅ Response served from cache${NC}"
    echo "  Duration: ${duration}ms (should be < 100ms)"
else
    echo "${YELLOW}⚠️  Not cached (cache might have expired)${NC}"
fi
echo ""

# Summary
echo "================================"
echo "🎉 Test Suite Complete!"
echo ""
echo "If all tests passed, your AI infrastructure is ready for Phase 2!"
echo ""
echo "Next steps:"
echo "1. Review AI_TESTING_GUIDE.md for detailed explanations"
echo "2. Test fallback by temporarily disabling OpenAI"
echo "3. Start building Phase 2 (Recommendations)"

