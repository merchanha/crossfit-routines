"""
Simple content-based recommender using Scikit-learn
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging

logger = logging.getLogger(__name__)


class SimpleRecommender:
    """
    Simple content-based recommendation model using Random Forest
    
    This is a basic implementation that can be trained on user workout data
    to predict which routines users will like.
    """
    
    def __init__(self):
        """Initialize the recommender"""
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def train(self, workout_data: pd.DataFrame):
        """
        Train the model on historical workout data
        
        Args:
            workout_data: DataFrame with columns:
                - user_id
                - routine_id
                - completion_rate
                - avg_time_delta
                - routine_type_encoded
                - user_preference (target: 1 if user liked, 0 if not)
        """
        if workout_data.empty:
            logger.warning("No training data provided")
            return
        
        # Feature engineering
        features = ['completion_rate', 'avg_time_delta']
        
        # Add more features if available
        if 'routine_type_encoded' in workout_data.columns:
            features.append('routine_type_encoded')
        
        X = workout_data[features]
        y = workout_data['user_preference']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10
        )
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        logger.info(f"✅ Model trained on {len(workout_data)} samples")
    
    def predict(self, user_features: dict) -> np.ndarray:
        """
        Predict which routines user will like
        
        Args:
            user_features: Dictionary with feature values
                - completion_rate
                - avg_time_delta
                - routine_type_encoded (optional)
        
        Returns:
            Array of probabilities for each class
        """
        if not self.is_trained or self.model is None:
            logger.warning("Model not trained, returning default predictions")
            return np.array([0.5, 0.5])  # Default probabilities
        
        # Convert to DataFrame
        df = pd.DataFrame([user_features])
        
        # Scale features
        X_scaled = self.scaler.transform(df)
        
        # Predict probabilities
        probabilities = self.model.predict_proba(X_scaled)[0]
        
        return probabilities
    
    def save(self, filepath: str):
        """Save trained model to file"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)
        
        # Save model and scaler
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'is_trained': self.is_trained
        }, filepath)
        
        logger.info(f"✅ Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load trained model from file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.is_trained = data.get('is_trained', True)
        
        logger.info(f"✅ Model loaded from {filepath}")

