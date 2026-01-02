# Recommendation Engine

Python ML service for generating personalized workout routine recommendations.

## 🎯 Overview

This service provides ML-powered recommendations by:
- Analyzing user workout history
- Using collaborative filtering and content-based approaches
- Generating personalized routine suggestions

## 🚀 Quick Start

### For Beginners

**👉 Start here if you're new to Python:**
- Read: `SETUP_FOR_BEGINNERS.md` (detailed step-by-step guide)
- Or: `SIMPLE_SETUP.md` (quick copy-paste commands)

### For Experienced Users

**Option 1: Use the start script (easiest)**
```bash
cd rec-engine
./start.sh
```

**Option 2: Manual setup**
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see below)

# Run the service
uvicorn app.main:app --reload --port 8000
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

### 3. Run the Service

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Test the Service

```bash
# Health check
curl http://localhost:8000/health

# Get recommendations (example)
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-user-id"}'
```

## 📁 Project Structure

```
rec-engine/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py      # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py          # Pydantic models
│   │   ├── simple_recommender.py    # Scikit-learn model
│   │   ├── collaborative_recommender.py  # Surprise model
│   │   └── hybrid_recommender.py    # LightFM model
│   ├── services/
│   │   ├── __init__.py
│   │   ├── recommendation_service.py  # Main service
│   │   └── data_preparation.py       # Data processing
│   └── utils/
│       ├── __init__.py
│       └── feature_engineering.py   # Feature extraction
├── models/                      # Saved trained models
│   └── .gitkeep
├── data/                        # Training data (optional)
│   └── .gitkeep
├── requirements.txt
├── .env.example
└── README.md
```

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_HOST`: Database host (default: localhost)
- `DATABASE_PORT`: Database port (default: 5432)
- `DATABASE_USERNAME`: Database username
- `DATABASE_PASSWORD`: Database password
- `DATABASE_NAME`: Database name
- `ML_MODEL_TYPE`: Model to use (simple, collaborative, hybrid)
- `ML_MODEL_PATH`: Path to saved model file

## 📊 API Endpoints

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "ml-recommendations",
  "version": "1.0.0"
}
```

### `POST /recommendations`
Generate recommendations for a user

**Request:**
```json
{
  "user_id": "uuid-string"
}
```

**Response:**
```json
{
  "existing_routines": [
    {
      "routine_id": "uuid",
      "reasoning": "Based on your performance...",
      "priority": 8
    }
  ],
  "new_routines": [
    {
      "name": "Cardio Blast",
      "description": "High-intensity cardio...",
      "estimated_duration": 30,
      "exercises": [...],
      "reasoning": "Addresses your weaknesses...",
      "priority": 9
    }
  ]
}
```

## 🧪 Development

### Running Tests

```bash
pytest tests/
```

### Training Models

```bash
python scripts/train_model.py
```

## 📚 ML Models

The service supports multiple ML approaches:

1. **Simple Recommender** (Scikit-learn)
   - Content-based filtering
   - Uses user performance features

2. **Collaborative Recommender** (Surprise)
   - User-based collaborative filtering
   - Finds similar users

3. **Hybrid Recommender** (LightFM)
   - Combines collaborative + content-based
   - Best for production

## 🔄 Integration with NestJS

The NestJS backend calls this service via HTTP:

```typescript
// In NestJS
const response = await httpService.post(
  'http://localhost:8000/recommendations',
  { user_id: userId }
);
```

## 📝 Notes

- Models are saved in `models/` directory
- Training data can be stored in `data/` directory
- Use `.env` for local development
- Production should use environment variables

