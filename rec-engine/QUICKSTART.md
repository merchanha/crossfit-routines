# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Setup Environment

```bash
cd rec-engine

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Database

Create a `.env` file in the `rec-engine` directory:

```env
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
```

**Or use the quick start script:**
```bash
./start.sh
```

### Step 3: Run the Service

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --port 8000

# Or use the start script
./start.sh
```

## ✅ Verify It's Working

### 1. Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ml-recommendations",
  "version": "1.0.0",
  "database": "connected"
}
```

### 2. Test Recommendations

```bash
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-user-id-here"}'
```

## 📁 Project Structure

```
rec-engine/
├── app/
│   ├── main.py                    # FastAPI application
│   ├── database/
│   │   └── connection.py          # Database connection
│   ├── models/
│   │   ├── schemas.py             # Pydantic models
│   │   └── simple_recommender.py  # ML model
│   └── services/
│       ├── recommendation_service.py  # Main service
│       └── data_preparation.py       # Data processing
├── models/                        # Saved models (created automatically)
├── data/                          # Training data (optional)
├── requirements.txt
├── .env                           # Your config (create this)
└── README.md
```

## 🔗 Integration with NestJS

Update your NestJS backend to call this service:

```typescript
// In backend/src/recommendations/services/python-ml.service.ts
const response = await httpService.post(
  'http://localhost:8000/recommendations',
  { user_id: userId }
);
```

## 🐛 Troubleshooting

### Database Connection Error

- Check that PostgreSQL is running: `docker ps | grep postgres`
- Verify database credentials in `.env`
- Test connection: `psql -h localhost -U postgres -d crossfit_pro`

### Port Already in Use

- Change port in `.env`: `SERVICE_PORT=8001`
- Or kill process: `lsof -ti:8000 | xargs kill -9`

### Module Not Found

- Make sure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

## 📚 Next Steps

1. **Test the service** - Make sure it connects to your database
2. **Train a model** - Use your workout data to train the ML model
3. **Integrate with NestJS** - Update the backend to call this service
4. **Improve recommendations** - Add more sophisticated ML models

## 🎯 What's Next?

See `PYTHON_ML_INTEGRATION_PLAN.md` for:
- How to train ML models
- Adding collaborative filtering
- Integrating with NestJS backend

