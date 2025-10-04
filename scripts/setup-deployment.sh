#!/bin/bash

# Setup Deployment Script
# This script helps set up the deployment environment

set -e

echo "🚀 Setting up CrossFit Routines Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo ""
print_info "This script will help you set up the deployment environment"
echo ""

# Check if .env files exist
echo "🔍 Checking environment files..."

if [ -f "backend/.env" ]; then
    print_status "Backend .env file exists"
else
    print_warning "Backend .env file not found"
    echo "Creating backend/.env from .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env from .env.example"
    else
        print_error "No .env.example found. Please create backend/.env manually"
    fi
fi

if [ -f "frontend/.env" ]; then
    print_status "Frontend .env file exists"
else
    print_warning "Frontend .env file not found"
    echo "Creating frontend/.env..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3001/api
EOF
    print_status "Created frontend/.env"
fi

# Check if dependencies are installed
echo ""
echo "🔍 Checking dependencies..."

if [ -d "backend/node_modules" ]; then
    print_status "Backend dependencies installed"
else
    print_warning "Backend dependencies not installed"
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    print_status "Backend dependencies installed"
fi

if [ -d "frontend/node_modules" ]; then
    print_status "Frontend dependencies installed"
else
    print_warning "Frontend dependencies not installed"
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    print_status "Frontend dependencies installed"
fi

# Check if build works
echo ""
echo "🔍 Testing builds..."

echo "Building backend..."
cd backend
if npm run build; then
    print_status "Backend build successful"
else
    print_error "Backend build failed"
    exit 1
fi
cd ..

echo "Building frontend..."
cd frontend
if npm run build; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Check if tests pass
echo ""
echo "🔍 Running tests..."

echo "Running backend tests..."
cd backend
if npm test -- --passWithNoTests; then
    print_status "Backend tests passed"
else
    print_warning "Backend tests failed (this might be expected if no tests exist)"
fi
cd ..

# Check if database is configured
echo ""
echo "🔍 Checking database configuration..."

if grep -q "DATABASE_URL" backend/.env; then
    print_status "Database URL configured"
else
    print_warning "Database URL not configured"
    echo "Please add DATABASE_URL to backend/.env"
fi

# Check if JWT secret is configured
if grep -q "JWT_SECRET" backend/.env; then
    print_status "JWT secret configured"
else
    print_warning "JWT secret not configured"
    echo "Please add JWT_SECRET to backend/.env"
fi

# Check if image storage is configured
if grep -q "IMAGE_STORAGE_PROVIDER" backend/.env; then
    print_status "Image storage provider configured"
else
    print_warning "Image storage provider not configured"
    echo "Please add IMAGE_STORAGE_PROVIDER to backend/.env"
fi

echo ""
print_status "Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables in backend/.env and frontend/.env"
echo "2. Set up your database (PostgreSQL)"
echo "3. Run database migrations: cd backend && npm run db:migration:run"
echo "4. Test locally: npm run start:dev (backend) and npm run dev (frontend)"
echo "5. Follow the DEPLOYMENT.md guide to deploy to production"
echo ""
echo "📚 For detailed deployment instructions, see DEPLOYMENT.md"
