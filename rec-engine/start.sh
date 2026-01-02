#!/bin/bash

# Quick start script for Recommendation Engine

echo "🚀 Starting Recommendation Engine..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/crossfit_pro
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=crossfit_pro

# ML Model Configuration
ML_MODEL_TYPE=simple
ML_MODEL_PATH=models/recommendation_model.pkl

# Service Configuration
SERVICE_PORT=8000
SERVICE_HOST=0.0.0.0
LOG_LEVEL=INFO
EOF
    echo "✅ .env file created. Please update with your database credentials."
fi

# Create models directory if it doesn't exist
mkdir -p models
mkdir -p data

# Start the service
echo "🎯 Starting FastAPI server..."
uvicorn app.main:app --reload --port 8000

