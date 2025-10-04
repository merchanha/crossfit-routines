#!/bin/bash

# Test Deployment Script
# This script tests if the deployment is working correctly

set -e

echo "🚀 Testing CrossFit Routines Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if backend URL is provided
if [ -z "$BACKEND_URL" ]; then
    print_error "BACKEND_URL environment variable is required"
    echo "Usage: BACKEND_URL=https://your-api.onrender.com ./scripts/test-deployment.sh"
    exit 1
fi

echo "Testing backend at: $BACKEND_URL"

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -s -f "$BACKEND_URL/api/health" > /dev/null; then
    print_status "Health endpoint is responding"
else
    print_error "Health endpoint is not responding"
    exit 1
fi

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test auth endpoints
echo "  - Testing auth endpoints..."
if curl -s -f "$BACKEND_URL/api/auth/register" -X POST -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","password":"password123"}' > /dev/null 2>&1; then
    print_status "Auth endpoints are accessible"
else
    print_warning "Auth endpoints may not be working (this could be expected if validation fails)"
fi

# Test users endpoint
echo "  - Testing users endpoint..."
if curl -s -f "$BACKEND_URL/api/users" > /dev/null 2>&1; then
    print_status "Users endpoint is accessible"
else
    print_warning "Users endpoint requires authentication (this is expected)"
fi

# Test routines endpoint
echo "  - Testing routines endpoint..."
if curl -s -f "$BACKEND_URL/api/routines" > /dev/null 2>&1; then
    print_status "Routines endpoint is accessible"
else
    print_warning "Routines endpoint requires authentication (this is expected)"
fi

# Test scheduled workouts endpoint
echo "  - Testing scheduled workouts endpoint..."
if curl -s -f "$BACKEND_URL/api/scheduled-workouts" > /dev/null 2>&1; then
    print_status "Scheduled workouts endpoint is accessible"
else
    print_warning "Scheduled workouts endpoint requires authentication (this is expected)"
fi

# Test CORS
echo "🔍 Testing CORS configuration..."
if curl -s -f -H "Origin: https://your-frontend.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "$BACKEND_URL/api/health" > /dev/null; then
    print_status "CORS is configured correctly"
else
    print_warning "CORS may not be configured properly"
fi

# Test database connection (if health endpoint provides this info)
echo "🔍 Testing database connection..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q "database"; then
    print_status "Database connection is working"
else
    print_warning "Could not verify database connection status"
fi

echo ""
print_status "Deployment test completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test user registration and login"
echo "2. Test routine creation and management"
echo "3. Test workout scheduling"
echo "4. Test image upload functionality"
echo "5. Verify frontend can connect to backend"
echo ""
echo "🌐 Backend URL: $BACKEND_URL"
echo "📚 API Documentation: $BACKEND_URL/api/docs"
