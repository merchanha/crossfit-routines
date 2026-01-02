# ML Model Quick Start Guide

## 🎯 Recommended Stack for Your Project

### **Phase 1: Start Simple (Recommended First Step)**

```bash
pip install scikit-learn pandas numpy sqlalchemy psycopg2-binary fastapi uvicorn pydantic
```

**Why this stack:**
- ✅ **Scikit-learn**: Easy ML algorithms (RandomForest, SVM, etc.)
- ✅ **Pandas**: Handle your workout data easily
- ✅ **NumPy**: Fast numerical operations
- ✅ **SQLAlchemy**: Connect to PostgreSQL
- ✅ **FastAPI**: Modern Python API framework

---

## 📦 Complete Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install core libraries
pip install scikit-learn pandas numpy scipy

# Install database libraries
pip install sqlalchemy psycopg2-binary

# Install API framework
pip install fastapi uvicorn pydantic

# Install model persistence
pip install joblib

# Optional: For recommendation systems
pip install scikit-surprise  # Collaborative filtering
pip install lightfm  # Hybrid recommendations
```

---

## 🚀 Quick Start Example

### 1. Simple Content-Based Recommendation Model

```python
# app/models/simple_recommender.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

class SimpleRecommender:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        
    def train(self, workout_data):
        """
        Train model on historical workout data
        
        workout_data: DataFrame with columns:
        - user_id
        - routine_id
        - completion_rate
        - avg_time_delta
        - routine_type (cardio, strength, etc.)
        - user_preference (target: 1 if user liked, 0 if not)
        """
        # Feature engineering
        features = ['completion_rate', 'avg_time_delta', 'routine_type_encoded']
        X = workout_data[features]
        y = workout_data['user_preference']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
    def predict(self, user_features):
        """
        Predict which routines user will like
        
        user_features: dict with completion_rate, avg_time_delta, etc.
        """
        # Convert to DataFrame
        df = pd.DataFrame([user_features])
        
        # Scale features
        X_scaled = self.scaler.transform(df)
        
        # Predict probabilities
        probabilities = self.model.predict_proba(X_scaled)[0]
        
        return probabilities
    
    def save(self, filepath):
        """Save trained model"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler
        }, filepath)
    
    def load(self, filepath):
        """Load trained model"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
```

### 2. Using Surprise for Collaborative Filtering

```python
# app/models/collaborative_recommender.py
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
import pandas as pd

class CollaborativeRecommender:
    def __init__(self):
        self.model = SVD()
        self.trainset = None
        
    def train(self, interactions_df):
        """
        Train collaborative filtering model
        
        interactions_df: DataFrame with columns:
        - user_id
        - routine_id
        - rating (0-10, based on completion rate, time delta, etc.)
        """
        reader = Reader(rating_scale=(0, 10))
        dataset = Dataset.load_from_df(
            interactions_df[['user_id', 'routine_id', 'rating']],
            reader
        )
        
        self.trainset, _ = train_test_split(dataset, test_size=0.2)
        self.model.fit(self.trainset)
    
    def get_recommendations(self, user_id, routine_ids):
        """
        Get recommendation scores for user
        
        user_id: User to get recommendations for
        routine_ids: List of routine IDs to score
        """
        predictions = []
        for routine_id in routine_ids:
            pred = self.model.predict(user_id, routine_id)
            predictions.append({
                'routine_id': routine_id,
                'score': pred.est
            })
        
        # Sort by score (highest first)
        return sorted(predictions, key=lambda x: x['score'], reverse=True)
```

### 3. Hybrid Approach with LightFM

```python
# app/models/hybrid_recommender.py
from lightfm import LightFM
from lightfm.datasets import Dataset
import numpy as np

class HybridRecommender:
    def __init__(self):
        self.model = LightFM(loss='warp')
        self.dataset = Dataset()
        
    def train(self, interactions, item_features):
        """
        Train hybrid model
        
        interactions: (user_id, routine_id, rating) tuples
        item_features: Dict mapping routine_id to feature list
        """
        # Build interactions
        self.dataset.fit(
            users=[u for u, _, _ in interactions],
            items=[i for _, i, _ in interactions]
        )
        
        interactions_matrix = self.dataset.build_interactions(interactions)
        item_features_matrix = self.dataset.build_item_features(item_features)
        
        # Train
        self.model.fit(
            interactions_matrix[0],
            item_features=item_features_matrix,
            epochs=30,
            num_threads=2
        )
    
    def get_recommendations(self, user_id, item_ids, item_features):
        """Get recommendations for user"""
        user_internal = self.dataset.mapping()[0][user_id]
        item_internals = [self.dataset.mapping()[1][item_id] for item_id in item_ids]
        
        scores = self.model.predict(
            user_internal,
            item_internals,
            item_features=item_features
        )
        
        return list(zip(item_ids, scores))
```

---

## 📊 Data Preparation Example

```python
# app/utils/data_preparation.py
import pandas as pd
from sqlalchemy import create_engine

def fetch_workout_data(user_id, db_connection):
    """
    Fetch and prepare data for ML model
    """
    query = """
    SELECT 
        sw.user_id,
        sw.routine_id,
        r.name as routine_name,
        r.estimated_duration,
        sw.final_duration,
        sw.completed,
        COUNT(*) OVER (PARTITION BY sw.user_id) as total_workouts,
        AVG(CASE WHEN sw.completed THEN 1 ELSE 0 END) 
            OVER (PARTITION BY sw.user_id) as completion_rate,
        AVG(sw.final_duration - r.estimated_duration * 60) 
            OVER (PARTITION BY sw.user_id) as avg_time_delta
    FROM scheduled_workouts sw
    JOIN routines r ON sw.routine_id = r.id
    WHERE sw.user_id = :user_id
    """
    
    df = pd.read_sql(query, db_connection, params={'user_id': user_id})
    
    # Create target variable (user preference)
    # User "likes" a routine if:
    # - Completed it multiple times
    # - Finished faster than estimated
    # - High completion rate
    df['user_preference'] = (
        (df['completed'] == True) &
        (df.groupby('routine_id')['completed'].transform('count') > 1) &
        (df['final_duration'] < df['estimated_duration'] * 60)
    ).astype(int)
    
    return df
```

---

## 🎓 Learning Path

### Week 1: Basics
1. Learn Pandas basics (data manipulation)
2. Learn NumPy basics (arrays, operations)
3. Understand your data structure

### Week 2: Simple Model
1. Build content-based recommender with scikit-learn
2. Train on your workout data
3. Evaluate model performance

### Week 3: Collaborative Filtering
1. Learn Surprise library
2. Implement user-based recommendations
3. Compare with content-based approach

### Week 4: Hybrid
1. Learn LightFM
2. Combine both approaches
3. Handle cold start problem

---

## 🤗 Optional: Hugging Face (Advanced)

**When to add:** After you have a working recommendation system and want semantic text matching.

**Installation:**
```bash
pip install sentence-transformers
```

**Use Case:** Semantic routine matching (find routines with similar meaning)

**Example:**
```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create embeddings for routine descriptions
descriptions = ["High-intensity cardio", "HIIT training", "Strength workout"]
embeddings = model.encode(descriptions)

# Find similar routines
query = "Cardio training"
query_embedding = model.encode([query])
similarities = cosine_similarity(query_embedding, embeddings)
```

**See `HUGGINGFACE_EVALUATION.md` for detailed analysis.**

---

## 📚 Resources

- **Pandas Tutorial**: https://pandas.pydata.org/docs/getting_started/
- **Scikit-learn Guide**: https://scikit-learn.org/stable/user_guide.html
- **Surprise Docs**: https://surprise.readthedocs.io/
- **LightFM Guide**: https://making.lyst.com/lightfm/docs/home.html
- **Sentence Transformers**: https://www.sbert.net/

---

## 💡 Tips

1. **Start simple**: Don't try to build the perfect model on day 1
2. **Understand your data**: Explore your workout data first
3. **Iterate**: Start with scikit-learn, then add complexity
4. **Evaluate**: Always measure model performance
5. **Save models**: Use joblib to persist trained models

