#!/bin/bash

echo "🚀 Setting up CrossFit Pro Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    echo "📝 Copy .env.example to .env and update the values"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first"
    exit 1
fi

# Start database
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
echo "🔍 Checking database connection..."
docker-compose exec postgres pg_isready -U postgres

if [ $? -eq 0 ]; then
    echo "✅ Database is ready!"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run start:dev"
echo ""
echo "📚 API Documentation:"
echo "   http://localhost:3001/api/docs"
echo ""
echo "🐘 Database Admin (pgAdmin):"
echo "   http://localhost:5050"
echo "   Email: admin@crossfit.com"
echo "   Password: admin"
