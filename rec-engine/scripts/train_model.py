#!/usr/bin/env python3
"""
Train ML recommendation model on historical workout data
"""
import sys
import os
import pandas as pd
import numpy as np
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_db
from app.models.simple_recommender import SimpleRecommender
from app.services.data_preparation import (
    fetch_user_workout_data,
    fetch_user_routines,
    prepare_features_for_ml
)
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_all_training_data():
    """
    Fetch all workout data from database for training
    """
    logger.info("📊 Fetching training data from database...")
    
    query = text("""
        SELECT 
            sw."userId",
            sw."routineId",
            sw.completed,
            sw."finalDuration",
            r."estimatedDuration",
            r.name as routine_name,
            r.description as routine_description,
            COUNT(*) OVER (PARTITION BY sw."userId") as total_workouts,
            COUNT(*) FILTER (WHERE sw.completed) OVER (PARTITION BY sw."userId") as completed_workouts,
            AVG(CASE WHEN sw.completed THEN 1 ELSE 0 END) 
                OVER (PARTITION BY sw."userId") as completion_rate,
            AVG(sw."finalDuration" - r."estimatedDuration" * 60) 
                OVER (PARTITION BY sw."userId") as avg_time_delta
        FROM scheduled_workouts sw
        JOIN routines r ON sw."routineId" = r.id
        WHERE sw.completed = true
        AND sw."finalDuration" IS NOT NULL
        AND r."estimatedDuration" IS NOT NULL
    """)
    
    with get_db() as db:
        result = db.execute(query)
        rows = result.fetchall()
        
        if not rows:
            logger.warning("⚠️  No training data found!")
            return pd.DataFrame()
        
        df = pd.DataFrame(rows)
        logger.info(f"✅ Fetched {len(df)} training samples")
        return df


def prepare_training_data(df: pd.DataFrame):
    """
    Prepare data for ML model training
    
    Creates target variable: user_preference
    - 1 if user completed the workout and performed well
    - 0 if user didn't complete or performed poorly
    """
    if df.empty:
        return pd.DataFrame()
    
    logger.info("🔧 Preparing training data...")
    
    # Create target variable (user_preference)
    # User "likes" a routine if:
    # - Completed it
    # - Finished within reasonable time (not too slow)
    # - Has done it multiple times (shows preference)
    
    # Calculate time delta
    df['time_delta'] = df['finalDuration'] - (df['estimatedDuration'] * 60)
    
    # Calculate routine frequency (how many times user did this routine)
    routine_counts = df.groupby(['userId', 'routineId']).size().reset_index(name='routine_frequency')
    df = df.merge(routine_counts, on=['userId', 'routineId'], how='left')
    
    # Create target: user_preference
    # 1 = user likes this routine (completed + good performance + done multiple times)
    # 0 = user doesn't like (not completed or poor performance)
    df['user_preference'] = (
        (df['completed'] == True) &
        (df['time_delta'] < 120) &  # Finished within 2 minutes of estimated
        (df['routine_frequency'] >= 2)  # Done at least 2 times
    ).astype(int)
    
    # Select features for training
    training_df = df[[
        'userId',
        'routineId',
        'completion_rate',
        'avg_time_delta',
        'user_preference'
    ]].copy()
    
    # Remove NaN values
    training_df = training_df.dropna()
    
    logger.info(f"✅ Prepared {len(training_df)} training samples")
    logger.info(f"   - Positive samples (liked): {training_df['user_preference'].sum()}")
    logger.info(f"   - Negative samples (not liked): {(training_df['user_preference'] == 0).sum()}")
    
    return training_df


def train_model(training_df: pd.DataFrame, model_path: str = "models/recommendation_model.pkl"):
    """
    Train the ML model on prepared data
    """
    if training_df.empty:
        logger.error("❌ No training data available!")
        return None
    
    if training_df['user_preference'].nunique() < 2:
        logger.warning("⚠️  Not enough variety in target variable. Need both liked and not-liked samples.")
        logger.info("   Model will use rule-based recommendations until more data is available.")
        return None
    
    logger.info("🤖 Training ML model...")
    
    # Initialize model
    model = SimpleRecommender()
    
    # Train model
    model.train(training_df)
    
    # Save model
    os.makedirs(os.path.dirname(model_path) if os.path.dirname(model_path) else '.', exist_ok=True)
    model.save(model_path)
    
    logger.info(f"✅ Model trained and saved to {model_path}")
    
    return model


def main():
    """Main training function"""
    print("=" * 60)
    print("🤖 ML Model Training Script")
    print("=" * 60)
    print()
    
    # Step 1: Fetch data
    df = fetch_all_training_data()
    
    if df.empty:
        print("❌ No training data found in database.")
        print("   Make sure you have:")
        print("   - Users with completed workouts")
        print("   - Workouts with finalDuration recorded")
        print("   - Routines with estimatedDuration")
        return
    
    # Step 2: Prepare data
    training_df = prepare_training_data(df)
    
    if training_df.empty:
        print("❌ Could not prepare training data.")
        return
    
    # Step 3: Train model
    model_path = os.getenv("ML_MODEL_PATH", "models/recommendation_model.pkl")
    model = train_model(training_df, model_path)
    
    if model:
        print()
        print("=" * 60)
        print("✅ Training Complete!")
        print("=" * 60)
        print(f"Model saved to: {model_path}")
        print()
        print("The recommendation service will now use this trained model.")
        print("Restart the service to load the new model.")
    else:
        print()
        print("⚠️  Model not trained (insufficient data variety).")
        print("The service will continue using rule-based recommendations.")


if __name__ == "__main__":
    main()

