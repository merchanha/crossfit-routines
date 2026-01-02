# Python ML Model Integration Plan

## 🎯 Goal
Replace AI-powered recommendations (Gemini/OpenAI) with a custom Python ML model, while keeping AI providers for other features (natural language routine generation).

---

## 📊 Architecture Overview

### Complete System Architecture

```mermaid
graph TB
    subgraph Frontend["🌐 Frontend (React)"]
        A1[RecommendationsView]
        A2[RoutinesLibrary]
        A3[Dashboard]
    end
    
    subgraph Backend["⚙️ Backend (NestJS)"]
        subgraph Recommendations["Recommendations Module"]
            B1[RecommendationsController]
            B2[RecommendationsService]
            B3[PerformanceAnalyzerService]
            B4[PythonMLService]
            B5[RecommendationBuilderService]
        end
        
        subgraph Generator["Generator Module (AI)"]
            B6[GeneratorController]
            B7[GeneratorService]
            B8[AIProviderFactory]
            B9[OpenAI Service]
            B10[Gemini Service]
        end
        
        B11[(Recommendations DB)]
        B12[(Routines DB)]
    end
    
    subgraph MLService["🤖 Python ML Service (FastAPI)"]
        C1[FastAPI Server]
        C2[/recommendations endpoint]
        C3[/health endpoint]
        C4[RecommendationService]
        C5[ML Model Engine]
        C6[Feature Engineering]
        C7[Database Connection]
        C8[Model Persistence]
    end
    
    subgraph MLModels["ML Models"]
        D1[Scikit-learn<br/>Content-Based]
        D2[Surprise<br/>Collaborative]
        D3[LightFM<br/>Hybrid]
        D4[Sentence Transformers<br/>Optional]
    end
    
    subgraph Database["🗄️ PostgreSQL Database"]
        E1[(scheduled_workouts)]
        E2[(routines)]
        E3[(recommendations)]
        E4[(users)]
        E5[(workout_notes)]
    end
    
    %% Frontend to Backend
    A1 -->|GET /api/recommendations| B1
    A2 -->|POST /api/generator/generate| B6
    A3 -->|GET /api/recommendations| B1
    
    %% Backend Flow - Recommendations
    B1 --> B2
    B2 --> B3
    B2 --> B4
    B3 -->|Performance Data| B5
    B4 -->|HTTP POST| C2
    B5 -->|Fallback if ML fails| B8
    
    %% Backend Flow - Generator (AI)
    B6 --> B7
    B7 --> B8
    B8 -->|Primary| B9
    B8 -->|Fallback| B10
    
    %% Backend to Database
    B2 -->|Save| B11
    B3 -->|Read| E1
    B3 -->|Read| E2
    
    %% ML Service Internal Flow
    C1 --> C2
    C1 --> C3
    C2 --> C4
    C4 --> C6
    C6 --> C5
    C5 --> D1
    C5 --> D2
    C5 --> D3
    C5 -.->|Optional| D4
    C4 --> C7
    C5 --> C8
    
    %% ML Service to Database
    C7 -->|SQL Queries| E1
    C7 -->|SQL Queries| E2
    C7 -->|SQL Queries| E4
    C7 -->|SQL Queries| E5
    
    %% ML Service Response
    C4 -->|JSON Response| B4
    B4 -->|Recommendations| B2
    B2 -->|JSON| B1
    B1 -->|JSON| A1
    
    %% Styling
    style Frontend fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    style Backend fill:#fff4e1,stroke:#e65100,stroke-width:2px
    style MLService fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style MLModels fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    style Database fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Recommendations fill:#fff9c4,stroke:#f57f17,stroke-width:1px
    style Generator fill:#e1bee7,stroke:#7b1fa2,stroke-width:1px
```

### Simple Architecture Flow

```mermaid
graph LR
    A[Frontend<br/>React] -->|HTTP/REST| B[Backend<br/>NestJS]
    B -->|HTTP/REST| C[ML Service<br/>Python/FastAPI]
    C -->|SQL Queries| D[Database<br/>PostgreSQL]
    C -->|Returns JSON| B
    B -->|Returns JSON| A
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#e8f5e9
    style D fill:#f3e5f5
```

### Detailed Architecture Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Frontend
    participant Backend as NestJS Backend
    participant MLService as Python ML Service
    participant Database as PostgreSQL
    
    User->>Frontend: Request Recommendations
    Frontend->>Backend: GET /api/recommendations
    Backend->>MLService: POST /recommendations {userId}
    MLService->>Database: Query workout history
    Database-->>MLService: Return workout data
    MLService->>MLService: Run ML Model Inference
    MLService-->>Backend: Return recommendations JSON
    Backend->>Backend: Save to recommendations table
    Backend-->>Frontend: Return recommendations
    Frontend-->>User: Display recommendations
```

### Data Flow Diagram

```mermaid
flowchart TD
    Start([User Requests Recommendations]) --> Frontend[Frontend: RecommendationsView]
    Frontend -->|GET /api/recommendations| Backend[Backend: RecommendationsController]
    
    Backend --> CheckCache{Check Cache}
    CheckCache -->|Hit| ReturnCached[Return Cached Recommendations]
    CheckCache -->|Miss| Analyze[PerformanceAnalyzerService]
    
    Analyze -->|Query DB| DB1[(scheduled_workouts)]
    Analyze -->|Query DB| DB2[(routines)]
    DB1 -->|Workout History| Analyze
    DB2 -->|User Routines| Analyze
    
    Analyze -->|Performance Data| MLService[PythonMLService]
    MLService -->|HTTP POST| FastAPI[FastAPI: /recommendations]
    
    FastAPI --> FetchData[Fetch Data from Database]
    FetchData -->|SQL| DB1
    FetchData -->|SQL| DB2
    FetchData -->|SQL| DB3[(users)]
    DB1 -->|Raw Data| FeatureEng[Feature Engineering]
    DB2 -->|Raw Data| FeatureEng
    DB3 -->|Raw Data| FeatureEng
    
    FeatureEng --> MLModel[ML Model Inference]
    MLModel -->|Scikit-learn| Model1[Content-Based Model]
    MLModel -->|Surprise| Model2[Collaborative Filtering]
    MLModel -->|LightFM| Model3[Hybrid Model]
    
    Model1 --> Combine[Combine Predictions]
    Model2 --> Combine
    Model3 --> Combine
    
    Combine --> Format[Format as JSON]
    Format -->|Recommendations JSON| FastAPI
    FastAPI -->|Return| MLService
    
    MLService -->|Success| SaveRec[Save to recommendations table]
    MLService -->|Failure| Fallback[Fallback to AI Provider]
    
    Fallback -->|AIProviderFactory| AI[Gemini/OpenAI]
    AI -->|AI Recommendations| SaveRec
    
    SaveRec -->|SQL INSERT| DB4[(recommendations)]
    SaveRec --> ReturnRec[Return Recommendations]
    ReturnCached --> ReturnRec
    
    ReturnRec -->|JSON Response| Backend
    Backend -->|JSON| Frontend
    Frontend --> Display([Display to User])
    
    style Start fill:#e1f5ff
    style Frontend fill:#e1f5ff
    style Backend fill:#fff4e1
    style MLService fill:#e8f5e9
    style FastAPI fill:#e8f5e9
    style MLModel fill:#f3e5f5
    style DB1 fill:#fce4ec
    style DB2 fill:#fce4ec
    style DB3 fill:#fce4ec
    style DB4 fill:#fce4ec
    style Display fill:#e1f5ff
```

### Component Architecture (Text Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - RecommendationsView                                      │
│  - RoutinesLibrary (AI Generator)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────────┐
│              NestJS Backend                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Recommendations Module                              │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  RecommendationBuilderService                 │  │  │
│  │  │  (REPLACED: Calls Python ML Service)         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Generator Module (KEEP AI)                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  GeneratorService                             │  │  │
│  │  │  (KEEPS: AIProviderFactory → Gemini/OpenAI)   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Module (KEEP)                                     │  │
│  │  - OpenAI Service                                     │  │
│  │  - Gemini Service                                     │  │
│  │  - AIProviderFactory                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│           Python ML Service (NEW)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI/Flask Server                                │  │
│  │  - /recommendations (POST)                           │  │
│  │  - /health (GET)                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ML Model (Your Custom Model)                        │  │
│  │  - Trained on workout data                           │  │
│  │  - Input: Performance analysis + existing routines  │  │
│  │  - Output: Recommendations (JSON)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ SQL Queries
                     │
┌────────────────────▼────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  - scheduled_workouts (workout history)                     │
│  - routines (user's routines)                               │
│  - recommendations (stored recommendations)                │
│  - users (user data)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Access: Two Approaches

**Yes, your Python service CAN consume data directly from the database!** There are two valid approaches:

### Database Access Decision Flow

```mermaid
flowchart TD
    Start([User Requests Recommendations]) --> Backend[NestJS Backend]
    Backend --> Decision{Which Approach?}
    
    Decision -->|Approach A| ApproachA[Approach A: Direct DB Access]
    Decision -->|Approach B| ApproachB[Approach B: Pre-processed Data]
    
    %% Approach A Flow
    ApproachA --> SendUserId[Send userId to Python]
    SendUserId --> PythonA[Python ML Service]
    PythonA --> ConnectDB[Connect to PostgreSQL]
    ConnectDB --> QueryA[Query: scheduled_workouts<br/>Query: routines<br/>Query: users]
    QueryA --> ProcessA[Process Raw Data]
    ProcessA --> FeatureEngA[Feature Engineering]
    FeatureEngA --> MLInferenceA[ML Model Inference]
    MLInferenceA --> ReturnA[Return Recommendations]
    
    %% Approach B Flow
    ApproachB --> QueryB[Query: scheduled_workouts<br/>Query: routines]
    QueryB --> ProcessB[Process in NestJS]
    ProcessB --> AnalyzeB[PerformanceAnalyzerService]
    AnalyzeB --> FormatB[Format as JSON]
    FormatB --> SendData[Send pre-processed data]
    SendData --> PythonB[Python ML Service]
    PythonB --> FeatureEngB[Feature Engineering]
    FeatureEngB --> MLInferenceB[ML Model Inference]
    MLInferenceB --> ReturnB[Return Recommendations]
    
    ReturnA --> Save[Save to recommendations table]
    ReturnB --> Save
    Save --> Response[Return to Frontend]
    
    style ApproachA fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style ApproachB fill:#fff4e1,stroke:#e65100,stroke-width:2px
    style PythonA fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style PythonB fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style Decision fill:#e1f5ff,stroke:#01579b,stroke-width:2px
```

### **Approach A: Python Reads Directly from Database** ⭐ Recommended for ML

**Architecture:**
```
NestJS → Python ML Service → PostgreSQL (direct connection)
```

**Pros:**
- ✅ **Better for ML training**: Python can fetch ALL historical data for training
- ✅ **More control**: Python decides what data to fetch and how to process it
- ✅ **Efficient**: No data transformation overhead in NestJS
- ✅ **Flexible**: Can query different data structures for different model types
- ✅ **Scalable**: Python can batch process multiple users

**Cons:**
- ❌ Python needs database connection (credentials, connection pooling)
- ❌ Duplicate database access logic (NestJS + Python)
- ❌ More complex deployment (Python needs DB access)

**Use Case:** When you want Python to have full control over data fetching, especially for:
- Training ML models on historical data
- Complex feature engineering
- Batch processing

---

### **Approach B: NestJS Sends Pre-processed Data** (Current Plan)

**Architecture:**
```
NestJS → (queries DB) → (processes data) → Python ML Service
```

**Pros:**
- ✅ **Simpler Python service**: Stateless, no database connection needed
- ✅ **Better separation**: NestJS handles all data access
- ✅ **Easier deployment**: Python service is just an API
- ✅ **Consistent**: Same data processing logic as current system

**Cons:**
- ❌ Less flexible for ML training (NestJS limits what data is sent)
- ❌ Data transformation happens in NestJS (not Python)
- ❌ Can't easily fetch all historical data for training

**Use Case:** When you want a simple, stateless Python service that just does inference.

---

## 🎯 **Recommended Hybrid Approach**

**Best of both worlds:**

1. **For Inference (Real-time recommendations):**
   - Use **Approach B**: NestJS sends pre-processed data
   - Fast, simple, stateless Python service

2. **For Training (ML model development):**
   - Use **Approach A**: Python reads directly from database
   - Separate training script that fetches all historical data
   - Train model offline, then use trained model in inference service

---

## 📝 Implementation: Approach A (Direct Database Access)

If you want Python to read directly from the database, here's how:

### Step 1: Python Database Connection

```python
# app/database/connection.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:password@localhost:5432/crossfit_pro'
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db():
    """Database session context manager"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Step 2: Python Service with Database Access

```python
# app/services/recommendation_service.py
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.schemas import ScheduledWorkout, Routine
from typing import List, Dict

class RecommendationService:
    def __init__(self):
        # Load your trained model
        # self.model = pickle.load(open('models/trained_model.pkl', 'rb'))
        pass
    
    def generate_recommendations_for_user(
        self,
        userId: str
    ) -> Dict:
        """
        Fetch data directly from database and generate recommendations
        """
        with get_db() as db:
            # Fetch user's workout history
            workouts = db.query(ScheduledWorkout).filter(
                ScheduledWorkout.userId == userId
            ).all()
            
            # Fetch user's routines
            routines = db.query(Routine).filter(
                Routine.userId == userId
            ).all()
            
            # Process data for ML model
            features = self._extract_features(workouts, routines)
            
            # Run ML model inference
            recommendations = self._predict(features, routines)
            
            return recommendations
    
    def _extract_features(self, workouts, routines):
        """Extract features from raw database data"""
        # Your feature engineering logic here
        # Example:
        completed_workouts = [w for w in workouts if w.completed]
        avg_duration = sum(w.finalDuration for w in completed_workouts) / len(completed_workouts)
        # ... more feature extraction
        return features
    
    def _predict(self, features, routines):
        """Run ML model prediction"""
        # Use your trained model
        # predictions = self.model.predict(features)
        # Format as recommendations
        return {
            "existing_routines": [...],
            "new_routines": [...]
        }
```

### Step 3: Update NestJS to Just Call Python

```typescript
// backend/src/recommendations/services/python-ml.service.ts
async generateRecommendations(
  userId: string, // Just send userId, Python fetches data
): Promise<AIRecommendationResponse> {
  const response = await firstValueFrom(
    this.httpService.post<AIRecommendationResponse>(
      `${this.baseUrl}/recommendations`,
      { userId }, // Simple: just send userId
      { timeout: 30000 },
    ),
  );
  return response.data;
}
```

### Step 4: Environment Variables

```bash
# Python service .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/crossfit_pro
# Or individual vars:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=crossfit_pro
```

---

## 📝 Implementation: Approach B (NestJS Sends Data)

This is what the original plan shows - NestJS processes data and sends it to Python. See the original implementation steps below.

---

## ✅ What to Keep vs Replace

### **KEEP** (Don't Touch):
1. **AI Module** (`backend/src/ai/`)
   - OpenAI Service
   - Gemini Service
   - AIProviderFactory
   - Rate Limiting & Caching

2. **Generator Module** (`backend/src/generator/`)
   - Natural language routine generation
   - YouTube video search
   - Uses AI providers (Gemini/OpenAI)

3. **Recommendations Module Structure**
   - `RecommendationsService` (orchestration)
   - `PerformanceAnalyzerService` (data analysis)
   - Database entities and DTOs
   - Controller endpoints

### **REPLACE**:
1. **RecommendationBuilderService** (`backend/src/recommendations/services/recommendation-builder.service.ts`)
   - Currently: Calls `AIProviderFactory.generateStructuredOutput()`
   - New: Calls Python ML service via HTTP

---

## 🚀 Implementation Steps

### **Phase 1: Python ML Service Setup**

#### Step 1.1: Create Python Service Structure
```
python-ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI/Flask app
│   ├── models/
│   │   ├── __init__.py
│   │   ├── recommendation_model.py  # Your ML model
│   │   └── schemas.py               # Pydantic models
│   ├── services/
│   │   ├── __init__.py
│   │   └── recommendation_service.py # ML inference logic
│   └── utils/
│       ├── __init__.py
│       └── data_preprocessing.py
├── requirements.txt
├── Dockerfile (optional)
└── README.md
```

#### Step 1.2: Create FastAPI Service
```python
# app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.recommendation_service import RecommendationService

app = FastAPI(title="CrossFit ML Recommendations API")

class PerformanceAnalysis(BaseModel):
    total_workouts: int
    completed_workouts: int
    completion_rate: float
    average_delta: float
    strengths: List[str]
    weaknesses: List[str]
    trends: dict

class ExistingRoutine(BaseModel):
    id: str
    name: str
    description: str
    estimated_duration: int
    exercises: List[dict]

# Option A: Direct database access (just send userId)
class RecommendationRequest(BaseModel):
    user_id: str

# Option B: Receive pre-processed data
class RecommendationRequest(BaseModel):
    performance_analysis: PerformanceAnalysis
    existing_routines: List[ExistingRoutine]

class RecommendationResponse(BaseModel):
    existing_routines: List[dict]
    new_routines: List[dict]

# Option A: Direct database access
@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Generate recommendations using ML model (direct DB access)"""
    try:
        service = RecommendationService()
        # Python fetches data from database
        recommendations = service.generate_recommendations_for_user(
            request.user_id
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Option B: Receive pre-processed data
@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Generate recommendations using ML model (receive data from NestJS)"""
    try:
        service = RecommendationService()
        recommendations = service.generate_recommendations(
            request.performance_analysis,
            request.existing_routines
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml-recommendations"}
```

#### Step 1.3: Implement ML Model Service

**Choose one approach:**

##### Option A: Direct Database Access (Recommended for ML)

```python
# app/services/recommendation_service.py
from app.database.connection import get_db
from app.models.schemas import ScheduledWorkout, Routine
from typing import Dict

class RecommendationService:
    def __init__(self):
        # Load your trained model
        # self.model = pickle.load(open('models/trained_model.pkl', 'rb'))
        pass
    
    def generate_recommendations_for_user(self, userId: str) -> Dict:
        """
        Fetch data from database and generate recommendations
        """
        with get_db() as db:
            # Fetch user's workout history
            workouts = db.query(ScheduledWorkout).filter(
                ScheduledWorkout.userId == userId
            ).all()
            
            # Fetch user's routines
            routines = db.query(Routine).filter(
                Routine.userId == userId
            ).all()
            
            # Extract features for ML model
            features = self._extract_features(workouts, routines)
            
            # Run ML model inference
            recommendations = self._predict(features, routines)
            
            return recommendations
    
    def _extract_features(self, workouts, routines):
        """Extract features from raw database data"""
        # Your feature engineering logic
        completed = [w for w in workouts if w.completed]
        # ... process data for ML model
        return features
    
    def _predict(self, features, routines):
        """Run ML model prediction"""
        # predictions = self.model.predict(features)
        return {
            "existing_routines": [...],
            "new_routines": [...]
        }
```

##### Option B: Receive Pre-processed Data (Simpler)

```python
# app/services/recommendation_service.py
import pickle
import numpy as np
from typing import List, Dict
from app.models.schemas import PerformanceAnalysis, ExistingRoutine

class RecommendationService:
    def __init__(self):
        # Load your trained model
        # self.model = pickle.load(open('models/trained_model.pkl', 'rb'))
        pass
    
    def generate_recommendations(
        self,
        performance_analysis: PerformanceAnalysis,
        existing_routines: List[ExistingRoutine]
    ) -> Dict:
        """
        Generate recommendations using ML model
        
        Steps:
        1. Preprocess input data
        2. Run model inference
        3. Post-process output
        4. Format as expected JSON
        """
        # Convert to features for ML model
        features = self._prepare_features(performance_analysis, existing_routines)
        
        # Run ML model
        predictions = self._predict(features)
        
        # Format as recommendations
        return {
            "existing_routines": [
                {
                    "routineId": "routine-1",
                    "reasoning": "Based on your performance, this routine matches your level",
                    "priority": 8
                }
            ],
            "new_routines": [
                {
                    "name": "ML-Generated Routine",
                    "description": "Generated by your custom model",
                    "estimatedDuration": 30,
                    "exercises": [
                        {"name": "Burpees", "sets": 3, "reps": 10},
                        {"name": "Squats", "sets": 3, "reps": 15}
                    ],
                    "reasoning": "Addresses your weaknesses",
                    "priority": 9
                }
            ]
        }
    
    def _prepare_features(self, analysis, routines):
        """Convert NestJS data to ML features"""
        # Feature engineering from pre-processed data
        return features
    
    def _predict(self, features):
        """Run ML model"""
        # predictions = self.model.predict(features)
        return predictions
```

---

### **Phase 2: NestJS Integration**

#### Step 2.1: Create Python ML Service Client
```typescript
// backend/src/recommendations/services/python-ml.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PerformanceAnalysisDto } from '../dto/performance-analysis.dto';
import { Routine } from '../../routines/entities/routine.entity';
import { AIRecommendationResponse } from './recommendation-builder.service';

@Injectable()
export class PythonMLService {
  private readonly logger = new Logger(PythonMLService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('PYTHON_ML_SERVICE_URL') ||
      'http://localhost:8000';
  }

  async generateRecommendations(
    performanceAnalysis: PerformanceAnalysisDto,
    existingRoutines: Routine[],
  ): Promise<AIRecommendationResponse> {
    this.logger.log('Calling Python ML service for recommendations');

    try {
      const requestBody = {
        performance_analysis: {
          total_workouts: performanceAnalysis.totalWorkouts,
          completed_workouts: performanceAnalysis.completedWorkouts,
          completion_rate: performanceAnalysis.completionRate,
          average_delta: performanceAnalysis.averageDelta,
          strengths: performanceAnalysis.strengths,
          weaknesses: performanceAnalysis.weaknesses,
          trends: performanceAnalysis.trends,
        },
        existing_routines: existingRoutines.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          estimated_duration: r.estimatedDuration,
          exercises: r.exercises,
        })),
      };

      const response = await firstValueFrom(
        this.httpService.post<AIRecommendationResponse>(
          `${this.baseUrl}/recommendations`,
          requestBody,
          {
            timeout: 30000, // 30 seconds timeout
          },
        ),
      );

      this.logger.log(
        `✅ Python ML service returned ${response.data.existing_routines.length} existing and ${response.data.new_routines.length} new recommendations`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to call Python ML service', error);
      throw new Error(
        `Python ML service error: ${error.response?.data?.detail || error.message}`,
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
```

#### Step 2.2: Update RecommendationBuilderService
```typescript
// backend/src/recommendations/services/recommendation-builder.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PythonMLService } from './python-ml.service';
import { PerformanceAnalysisDto } from '../dto/performance-analysis.dto';
import { Routine } from '../../routines/entities/routine.entity';
import { AIProviderFactory } from '../../ai/services/ai-provider.factory';

export interface AIRecommendationResponse {
  existingRoutines: Array<{
    routineId: string;
    reasoning: string;
    priority: number;
  }>;
  newRoutines: Array<{
    name: string;
    description: string;
    estimatedDuration: number;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      notes?: string;
    }>;
    reasoning: string;
    priority: number;
  }>;
}

@Injectable()
export class RecommendationBuilderService {
  private readonly logger = new Logger(RecommendationBuilderService.name);

  constructor(
    private readonly pythonMLService: PythonMLService,
    private readonly aiProviderFactory: AIProviderFactory, // Keep for fallback
  ) {}

  async generateRecommendations(
    performanceAnalysis: PerformanceAnalysisDto,
    existingRoutines: Routine[],
  ): Promise<AIRecommendationResponse> {
    this.logger.log('Generating recommendations using Python ML model');

    try {
      // Try Python ML service first
      const mlRecommendations = await this.pythonMLService.generateRecommendations(
        performanceAnalysis,
        existingRoutines,
      );

      this.logger.log('✅ Successfully got recommendations from Python ML service');
      return mlRecommendations;
    } catch (error) {
      this.logger.warn(
        `Python ML service failed: ${error.message}. Falling back to AI provider.`,
      );

      // Fallback to AI provider if Python service fails
      return this.generateAIRecommendations(performanceAnalysis, existingRoutines);
    }
  }

  /**
   * Fallback method using AI providers (Gemini/OpenAI)
   */
  private async generateAIRecommendations(
    performanceAnalysis: PerformanceAnalysisDto,
    existingRoutines: Routine[],
  ): Promise<AIRecommendationResponse> {
    this.logger.log('Using AI provider as fallback');

    const prompt = this.buildRecommendationPrompt(performanceAnalysis, existingRoutines);
    const schema = { /* ... existing schema ... */ };

    const response = await this.aiProviderFactory.generateStructuredOutput<AIRecommendationResponse>(
      prompt,
      schema,
    );

    return response.data;
  }

  // ... rest of the existing methods ...
}
```

#### Step 2.3: Update RecommendationsModule
```typescript
// backend/src/recommendations/recommendations.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Add this
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { PerformanceAnalyzerService } from './services/performance-analyzer.service';
import { RecommendationBuilderService } from './services/recommendation-builder.service';
import { PythonMLService } from './services/python-ml.service'; // Add this
// ... other imports

@Module({
  imports: [
    TypeOrmModule.forFeature([Recommendation, RecommendationItem]),
    HttpModule, // Add this for HTTP calls to Python service
    // ... other imports
  ],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    PerformanceAnalyzerService,
    RecommendationBuilderService,
    PythonMLService, // Add this
    // ... other providers
  ],
})
export class RecommendationsModule {}
```

#### Step 2.4: Add Environment Variable
```bash
# .env
PYTHON_ML_SERVICE_URL=http://localhost:8000
```

---

### **Phase 3: Testing & Deployment**

#### Step 3.1: Install Python Dependencies
```bash
cd python-ml-service
pip install fastapi uvicorn pydantic numpy pandas scikit-learn
# Add your ML framework (TensorFlow, PyTorch, etc.)
```

#### Step 3.2: Run Python Service
```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Step 3.3: Test Integration
```bash
# Test Python service directly
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "performance_analysis": { ... },
    "existing_routines": [ ... ]
  }'

# Test from NestJS
curl http://localhost:3001/api/recommendations
```

---

## 🔄 Fallback Strategy

**Recommended Approach:**
1. **Primary**: Python ML Model
2. **Fallback**: AI Providers (Gemini/OpenAI)
3. **Last Resort**: Rule-based recommendations

This ensures:
- Your ML model is used when available
- System remains functional if Python service is down
- Users always get recommendations

---

## 📦 Dependencies to Add

### NestJS Backend:
```bash
cd backend
npm install @nestjs/axios axios
```

### Python Service:
```bash
cd python-ml-service
pip install fastapi uvicorn pydantic
# Add your ML framework
```

---

## 🎓 Learning Resources

### For ML Model Development:
- **Scikit-learn**: Great for traditional ML (classification, regression)
- **TensorFlow/Keras**: For neural networks
- **PyTorch**: Alternative to TensorFlow
- **Pandas**: Data manipulation
- **NumPy**: Numerical computing

### For FastAPI:
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Pydantic for data validation

---

## ✅ Summary

**What You're Replacing:**
- `RecommendationBuilderService.generateRecommendations()` → Calls Python ML service instead of AI

**What You're Keeping:**
- All AI infrastructure (Gemini/OpenAI) for routine generation
- Recommendations module structure
- Frontend (no changes needed!)

**Benefits:**
- Full control over recommendation logic
- Can train on your own data
- No API costs for recommendations
- Can experiment with different ML algorithms
- Still have AI fallback for reliability

---

## 🤔 Which Approach Should You Choose?

### **Choose Approach A (Direct DB Access) if:**
- ✅ You want to train ML models on historical data
- ✅ You need complex feature engineering in Python
- ✅ You want Python to control data fetching
- ✅ You're building a more sophisticated ML pipeline

### **Choose Approach B (NestJS Sends Data) if:**
- ✅ You want a simple, stateless Python service
- ✅ You prefer NestJS to handle all database access
- ✅ You want easier deployment (Python doesn't need DB credentials)
- ✅ You're starting simple and can migrate later

### **My Recommendation:**
Start with **Approach A** if you're serious about ML, because:
1. You'll need database access for **training** anyway
2. More flexible for feature engineering
3. Can always simplify later if needed

---

---

## 🤖 ML Framework & Library Recommendations

Based on your use case (workout routine recommendations), here are the best options:

### **🎯 Recommended Stack for Beginners**

#### **1. Scikit-learn + Pandas + NumPy** ⭐ **BEST STARTING POINT**

**Why:**
- ✅ **Easy to learn**: Simple, well-documented
- ✅ **Perfect for structured data**: Your workout data fits perfectly
- ✅ **Fast development**: Get a working model quickly
- ✅ **Great for traditional ML**: Classification, regression, clustering

**Use Cases:**
- Content-based filtering (recommend routines based on user performance)
- Classification (predict which routine user will like)
- Clustering (group similar users/routines)

**Installation:**
```bash
pip install scikit-learn pandas numpy
```

**Example Approach:**
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pandas as pd

# Feature engineering
features = ['avg_delta', 'completion_rate', 'cardio_strength', ...]
X = df[features]
y = df['routine_preference']  # Target: which routines user likes

# Train model
model = RandomForestClassifier()
model.fit(X, y)

# Predict recommendations
predictions = model.predict_proba(user_features)
```

---

### **2. Surprise (scikit-surprise)** ⭐ **BEST FOR RECOMMENDATIONS**

**Why:**
- ✅ **Built specifically for recommendation systems**
- ✅ **Collaborative filtering**: Find users with similar preferences
- ✅ **Multiple algorithms**: SVD, KNN, SlopeOne, etc.
- ✅ **Easy to use**: Simple API

**Use Cases:**
- User-based collaborative filtering
- Item-based collaborative filtering
- Matrix factorization

**Installation:**
```bash
pip install scikit-surprise pandas numpy
```

**Example Approach:**
```python
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
import pandas as pd

# Prepare data: user_id, routine_id, rating (implicit: completion rate)
data = pd.DataFrame({
    'user_id': [...],
    'routine_id': [...],
    'rating': [...]  # Based on completion rate, time delta, etc.
})

reader = Reader(rating_scale=(0, 10))
dataset = Dataset.load_from_df(data, reader)

# Train model
trainset, testset = train_test_split(dataset, test_size=0.2)
algo = SVD()
algo.fit(trainset)

# Get recommendations
predictions = algo.test(testset)
```

---

### **3. LightFM** ⭐ **BEST FOR HYBRID RECOMMENDATIONS**

**Why:**
- ✅ **Hybrid approach**: Combines collaborative + content-based
- ✅ **Handles cold start**: Works for new users/routines
- ✅ **Fast**: Optimized for large datasets
- ✅ **Good for your use case**: You have both user interactions AND routine features

**Use Cases:**
- Hybrid recommendation systems
- Cold start problem (new users/routines)
- Combining multiple data sources

**Installation:**
```bash
pip install lightfm pandas numpy scipy
```

**Example Approach:**
```python
from lightfm import LightFM
from lightfm.datasets import Dataset
import numpy as np

# Build interactions matrix (user x routine)
interactions = build_interactions(...)

# Build item features (routine characteristics)
item_features = build_item_features(...)

# Train hybrid model
model = LightFM(loss='warp')
model.fit(interactions, item_features=item_features, epochs=30)

# Get recommendations
scores = model.predict(user_id, item_ids, item_features=item_features)
```

---

### **4. TensorFlow/Keras** (For Deep Learning)

**Why:**
- ✅ **Neural networks**: Can learn complex patterns
- ✅ **Embeddings**: Learn user/routine representations
- ✅ **Scalable**: Handles large datasets
- ⚠️ **More complex**: Requires more data and tuning

**Use Cases:**
- Deep learning recommendation models
- Neural collaborative filtering
- When you have lots of data

**Installation:**
```bash
pip install tensorflow pandas numpy
```

**Example Approach:**
```python
import tensorflow as tf
from tensorflow import keras

# Build neural network
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(feature_count,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dense(num_routines, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy')
model.fit(X_train, y_train, epochs=50)
```

---

### **5. PyTorch** (Alternative to TensorFlow)

**Why:**
- ✅ **Flexible**: More control over model architecture
- ✅ **Research-friendly**: Good for experimentation
- ⚠️ **More complex**: Steeper learning curve

**Use Cases:**
- Custom neural network architectures
- Research and experimentation

---

## 📚 **My Recommendation: Start Here**

### **Phase 1: Start Simple (Week 1-2)**
```
Scikit-learn + Pandas + NumPy
```
- Build a content-based recommendation system
- Use user performance features (completion rate, time delta, etc.)
- Predict which existing routines to recommend

### **Phase 2: Add Collaborative Filtering (Week 3-4)**
```
Add Surprise library
```
- Implement user-based collaborative filtering
- Find users with similar workout patterns
- Recommend routines that similar users liked

### **Phase 3: Hybrid Approach (Week 5+)**
```
Add LightFM
```
- Combine content-based + collaborative filtering
- Better recommendations for new users
- Handle cold start problem

### **Phase 4: Deep Learning (Later, if needed)**
```
TensorFlow/Keras
```
- Only if you have lots of data
- Need more complex patterns
- Want to experiment with embeddings

---

## 🛠️ **Essential Libraries for Any Approach**

### **Core Data Processing:**
```bash
pip install pandas numpy scipy
```
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **SciPy**: Scientific computing

### **Database Access:**
```bash
pip install sqlalchemy psycopg2-binary
```
- **SQLAlchemy**: ORM for database access
- **psycopg2**: PostgreSQL driver

### **API Framework:**
```bash
pip install fastapi uvicorn pydantic
```
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation

### **Model Persistence:**
```bash
pip install joblib pickle5
```
- **Joblib**: Save/load trained models
- **Pickle**: Python object serialization

### **Evaluation & Metrics:**
```bash
pip install scikit-learn  # Includes metrics
```
- Precision, Recall, F1-score
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)

---

## 📖 **Learning Resources**

### **For Scikit-learn:**
- Official docs: https://scikit-learn.org/stable/
- Tutorial: https://scikit-learn.org/stable/tutorial/

### **For Surprise:**
- GitHub: https://github.com/NicolasHug/Surprise
- Documentation: https://surprise.readthedocs.io/

### **For LightFM:**
- GitHub: https://github.com/lyst/lightfm
- Documentation: https://making.lyst.com/lightfm/docs/home.html

### **For Recommendation Systems (General):**
- "Building Recommendation Systems" by O'Reilly
- "Recommender Systems Handbook" (academic but comprehensive)

---

---

## 🤗 **Hugging Face: Is It Worth It?**

**Short Answer:** Not initially, but can add value later for text understanding.

### **When Hugging Face IS Worth It:**
- ✅ **Semantic routine matching**: Find routines with similar meaning
- ✅ **Text embeddings**: Convert descriptions to vectors for similarity
- ✅ **User preference extraction**: Understand preferences from notes
- ✅ **Exercise clustering**: Group similar exercises

### **When Hugging Face is NOT Worth It:**
- ❌ **Simple collaborative filtering**: Use Surprise instead
- ❌ **Pure numerical features**: Use Scikit-learn instead
- ❌ **Just starting**: Adds unnecessary complexity

### **Recommended Approach:**
1. **Start without Hugging Face** (Weeks 1-4)
   - Build core system with Scikit-learn + Surprise
   - Use structured data (completion rates, time deltas)

2. **Add Sentence Transformers later** (Week 5+)
   - For semantic routine matching
   - When text understanding becomes important

**See `HUGGINGFACE_EVALUATION.md` for detailed analysis and code examples.**

---

## 🚦 Next Steps

1. **Decide on database access approach** (A or B)
2. **Start with Python service skeleton** (Phase 1)
3. **Develop your ML model** (separate task)
4. **Integrate with NestJS** (Phase 2)
5. **Test end-to-end** (Phase 3)
6. **Deploy both services** (Docker Compose or separate servers)

Would you like me to:
1. Create the Python service skeleton with database access (Approach A)?
2. Create the Python service skeleton without database (Approach B)?
3. Update the NestJS code to integrate with Python?
4. Both Python service + NestJS integration?

