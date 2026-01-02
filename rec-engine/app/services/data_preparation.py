"""
Data preparation and feature engineering for ML models
"""
import pandas as pd
from sqlalchemy import text
from app.database.connection import get_db
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


def fetch_user_workout_data(user_id: str) -> pd.DataFrame:
    """
    Fetch user's workout history from database
    
    Args:
        user_id: User ID
        
    Returns:
        DataFrame with workout history
    """
    query = text("""
        SELECT 
            sw.id as workout_id,
            sw."userId" as user_id,
            sw."routineId" as sw_routine_id,
            sw.date,
            sw.completed,
            sw."finalDuration" as final_duration,
            r.id as routine_id,
            r.name as routine_name,
            r.description as routine_description,
            r."estimatedDuration" as estimated_duration,
            r.exercises as routine_exercises,
            COUNT(*) OVER (PARTITION BY sw."userId") as total_workouts,
            COUNT(*) FILTER (WHERE sw.completed) OVER (PARTITION BY sw."userId") as completed_workouts,
            AVG(CASE WHEN sw.completed THEN 1 ELSE 0 END) 
                OVER (PARTITION BY sw."userId") as completion_rate,
            AVG(sw."finalDuration" - r."estimatedDuration" * 60) 
                OVER (PARTITION BY sw."userId") as avg_time_delta
        FROM scheduled_workouts sw
        JOIN routines r ON sw."routineId" = r.id
        WHERE sw."userId" = :user_id
        ORDER BY sw.date DESC
    """)
    
    with get_db() as db:
        result = db.execute(query, {"user_id": user_id})
        rows = result.fetchall()
        
        if not rows:
            logger.warning(f"No workout data found for user {user_id}")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(rows)
        return df


def fetch_user_routines(user_id: str) -> pd.DataFrame:
    """
    Fetch user's routines from database
    
    Args:
        user_id: User ID
        
    Returns:
        DataFrame with user's routines
    """
    query = text("""
        SELECT 
            id,
            name,
            description,
            "estimatedDuration" as estimated_duration,
            exercises,
            "aiGenerated" as ai_generated
        FROM routines
        WHERE "userId" = :user_id
        ORDER BY "createdAt" DESC
    """)
    
    with get_db() as db:
        result = db.execute(query, {"user_id": user_id})
        rows = result.fetchall()
        
        if not rows:
            logger.warning(f"No routines found for user {user_id}")
            return pd.DataFrame()
        
        df = pd.DataFrame(rows)
        return df


def prepare_features_for_ml(workout_df: pd.DataFrame, routines_df: pd.DataFrame) -> Dict:
    """
    Prepare features for ML model
    
    Args:
        workout_df: DataFrame with workout history
        routines_df: DataFrame with user's routines
        
    Returns:
        Dictionary with features
    """
    features = {}
    
    if workout_df.empty:
        return {
            "completion_rate": 0.0,
            "avg_time_delta": 0.0,
            "total_workouts": 0,
            "completed_workouts": 0,
            "has_cardio": False,
            "has_strength": False,
            "avg_duration": 0.0
        }
    
    # Basic statistics (handle NaN values)
    completion_rate = workout_df["completion_rate"].iloc[0] if not workout_df.empty else 0.0
    features["completion_rate"] = float(completion_rate) if pd.notna(completion_rate) else 0.0
    
    avg_time_delta = workout_df["avg_time_delta"].iloc[0] if not workout_df.empty else 0.0
    features["avg_time_delta"] = float(avg_time_delta) if pd.notna(avg_time_delta) else 0.0
    
    total_workouts = workout_df["total_workouts"].iloc[0] if not workout_df.empty else 0
    features["total_workouts"] = int(total_workouts) if pd.notna(total_workouts) else 0
    
    completed_workouts = workout_df["completed_workouts"].iloc[0] if not workout_df.empty else 0
    features["completed_workouts"] = int(completed_workouts) if pd.notna(completed_workouts) else 0
    
    # Routine type analysis
    if not routines_df.empty:
        routine_names = " ".join(routines_df["name"].astype(str).str.lower())
        features["has_cardio"] = any(word in routine_names for word in ["cardio", "hiit", "running", "endurance"])
        features["has_strength"] = any(word in routine_names for word in ["strength", "weight", "lifting", "power"])
    else:
        features["has_cardio"] = False
        features["has_strength"] = False
    
    # Average duration
    completed_workouts = workout_df[workout_df["completed"] == True]
    # The query aliases finalDuration as final_duration, so use that
    if not completed_workouts.empty and "final_duration" in completed_workouts.columns:
        avg_dur = completed_workouts["final_duration"].mean()
        features["avg_duration"] = float(avg_dur / 60) if pd.notna(avg_dur) else 0.0  # Convert to minutes
    else:
        features["avg_duration"] = 0.0
    
    return features


def create_user_routine_interactions(user_id: str) -> List[Tuple[str, str, float]]:
    """
    Create user-routine interaction matrix for collaborative filtering
    
    Returns:
        List of (user_id, routine_id, rating) tuples
    """
    workout_df = fetch_user_workout_data(user_id)
    
    if workout_df.empty:
        return []
    
    interactions = []
    
    # Calculate rating based on completion and performance
    for _, row in workout_df.iterrows():
        routine_id = str(row["routine_id"])
        rating = 0.0
        
        if row["completed"]:
            rating = 5.0  # Base rating for completion
            
            # Adjust based on time delta (negative = faster = better)
            # Query aliases: finalDuration -> final_duration, estimatedDuration -> estimated_duration
            if pd.notna(row.get("final_duration")) and pd.notna(row.get("estimated_duration")):
                time_delta = row["final_duration"] - (row["estimated_duration"] * 60)
                if time_delta < -60:  # Finished more than 1 minute faster
                    rating += 2.0
                elif time_delta < 0:  # Finished faster
                    rating += 1.0
                elif time_delta > 120:  # Took more than 2 minutes longer
                    rating -= 1.0
        
        interactions.append((user_id, routine_id, rating))
    
    return interactions

