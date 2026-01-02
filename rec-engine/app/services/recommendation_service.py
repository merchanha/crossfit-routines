"""
Main recommendation service that orchestrates ML model inference
"""
import logging
import os
from typing import List
from app.database.connection import get_db
from app.models.schemas import (
    RecommendationResponse,
    ExistingRoutineRecommendation,
    NewRoutineRecommendation,
    Exercise
)
from app.services.data_preparation import (
    fetch_user_workout_data,
    fetch_user_routines,
    prepare_features_for_ml,
    create_user_routine_interactions
)
from app.models.simple_recommender import SimpleRecommender
from sqlalchemy import text
import uuid

logger = logging.getLogger(__name__)


class RecommendationService:
    """Main service for generating recommendations"""

    def __init__(self):
        """Initialize recommendation service"""
        self.model_type = os.getenv("ML_MODEL_TYPE", "simple")
        self.model_path = os.getenv(
            "ML_MODEL_PATH", "models/recommendation_model.pkl")

        # Initialize ML model
        self.model = SimpleRecommender()

        # Try to load existing model if available
        try:
            if os.path.exists(self.model_path):
                self.model.load(self.model_path)
                logger.info(f"✅ Loaded model from {self.model_path}")
            else:
                logger.warning(
                    f"⚠️  Model not found at {self.model_path}, using default recommendations")
        except Exception as e:
            logger.warning(
                f"⚠️  Could not load model: {e}, using default recommendations")

    async def generate_recommendations(self, user_id: str) -> RecommendationResponse:
        """
        Generate recommendations for a user

        Args:
            user_id: User ID to generate recommendations for

        Returns:
            RecommendationResponse with existing and new routine recommendations
        """
        logger.info(f"Generating recommendations for user {user_id}")

        # Fetch user data
        workout_df = fetch_user_workout_data(user_id)
        routines_df = fetch_user_routines(user_id)

        if workout_df.empty and routines_df.empty:
            logger.warning(
                f"No data found for user {user_id}, returning default recommendations")
            return self._generate_default_recommendations()

        # Prepare features
        features = prepare_features_for_ml(workout_df, routines_df)

        # Log what data we're analyzing
        logger.info(f"📊 User data analysis:")
        logger.info(f"  - Workouts found: {len(workout_df)}")
        logger.info(f"  - Routines found: {len(routines_df)}")
        logger.info(f"  - Features: {features}")
        logger.info(
            f"  - Model trained: {self.model.is_trained if hasattr(self.model, 'is_trained') else False}")

        # Generate recommendations
        # NOTE: Currently using rule-based recommendations based on real user data
        # The ML model is initialized but not yet integrated (needs training data first)
        existing_routines = await self._recommend_existing_routines(
            user_id, routines_df, features
        )

        new_routines = await self._generate_new_routines(user_id, features)

        logger.info(
            f"✅ Generated {len(existing_routines)} existing and {len(new_routines)} new recommendations")

        return RecommendationResponse(
            existing_routines=existing_routines,
            new_routines=new_routines
        )

    async def _recommend_existing_routines(
        self,
        user_id: str,
        routines_df,
        features: dict
    ) -> List[ExistingRoutineRecommendation]:
        """Recommend existing routines from user's library"""
        if routines_df.empty:
            return []

        recommendations = []

        # Check if ML model is trained and use it
        use_ml = (
            hasattr(self.model, 'is_trained') and
            self.model.is_trained and
            self.model.model is not None
        )

        for idx, row in routines_df.iterrows():
            if use_ml:
                # Use ML model prediction
                try:
                    # Predict probability user will like this routine
                    prediction = self.model.predict(features)
                    # prediction[1] is probability of "liked" class
                    ml_score = float(prediction[1]) if len(
                        prediction) > 1 else 0.5
                    score = ml_score * 10  # Scale to 1-10
                    logger.debug(
                        f"ML prediction for routine {row['id']}: {ml_score}")
                except Exception as e:
                    logger.warning(
                        f"ML prediction failed, using rule-based: {e}")
                    score = self._calculate_rule_based_score(row, features)
            else:
                # Use rule-based scoring
                score = self._calculate_rule_based_score(row, features)

            # Normalize to 1-10
            priority = min(10, max(1, int(score)))

            reasoning = self._generate_reasoning_for_existing_routine(
                row, features, use_ml
            )

            recommendations.append(
                ExistingRoutineRecommendation(
                    routine_id=str(row["id"]),
                    reasoning=reasoning,
                    priority=priority
                )
            )

        # Sort by priority
        recommendations.sort(key=lambda x: x.priority, reverse=True)

        return recommendations[:5]  # Return top 5

    def _calculate_rule_based_score(self, row, features: dict) -> float:
        """Calculate score using rule-based logic"""
        score = 5.0  # Base score

        # Adjust score based on user performance
        if features.get("completion_rate", 0) > 0.7:
            score += 1.0

        if features.get("avg_time_delta", 0) < -60:  # User finishes faster
            score += 1.0

        # Adjust based on routine type
        routine_name_lower = str(row["name"]).lower()
        if features.get("has_cardio") and "cardio" in routine_name_lower:
            score += 0.5
        if features.get("has_strength") and any(word in routine_name_lower for word in ["strength", "weight"]):
            score += 0.5

        return score

    async def _generate_new_routines(
        self,
        user_id: str,
        features: dict
    ) -> List[NewRoutineRecommendation]:
        """Generate new routine recommendations"""
        routines = []

        # Generate routine based on weaknesses
        if features.get("completion_rate", 0) < 0.5:
            # Low completion rate - suggest shorter, focused routine
            routines.append(self._create_quick_workout_routine(features))

        if features.get("avg_time_delta", 0) > 120:
            # Takes too long - suggest time-efficient routine
            routines.append(self._create_time_efficient_routine(features))

        if not features.get("has_cardio", False):
            # Missing cardio - suggest cardio routine
            routines.append(self._create_cardio_routine(features))

        if not features.get("has_strength", False):
            # Missing strength - suggest strength routine
            routines.append(self._create_strength_routine(features))

        # If no specific weaknesses, suggest balanced routine
        if not routines:
            routines.append(self._create_balanced_routine(features))

        return routines[:3]  # Return top 3

    def _generate_reasoning_for_existing_routine(self, routine_row, features: dict, use_ml: bool = False) -> str:
        """Generate reasoning text for existing routine recommendation"""
        reasons = []

        if use_ml:
            reasons.append(
                "ML model predicts you'll like this routine based on your workout patterns")
        else:
            if features.get("completion_rate", 0) > 0.7:
                reasons.append("You have a high completion rate")

            if features.get("avg_time_delta", 0) < -60:
                reasons.append("you finish workouts efficiently")

            routine_name = str(routine_row["name"]).lower()
            if "cardio" in routine_name and features.get("has_cardio"):
                reasons.append("matches your cardio preferences")

            if any(word in routine_name for word in ["strength", "weight"]) and features.get("has_strength"):
                reasons.append("aligns with your strength training")

        if not reasons:
            reasons.append("this routine matches your current fitness level")

        return f"Recommended because {', '.join(reasons)}."

    def _create_quick_workout_routine(self, features: dict) -> NewRoutineRecommendation:
        """Create a quick 20-minute workout routine"""
        return NewRoutineRecommendation(
            name="Quick 20-Minute HIIT",
            description="A fast-paced workout designed to improve time efficiency and build consistency.",
            estimated_duration=20,
            exercises=[
                Exercise(name="Burpees", sets=3, reps=10,
                         notes="Keep your back straight"),
                Exercise(name="Mountain Climbers", sets=3,
                         reps=20, notes="Maintain steady pace"),
                Exercise(name="Jump Squats", sets=3,
                         reps=15, notes="Land softly"),
                Exercise(name="Plank Hold", sets=3, reps=30,
                         notes="Hold for 30 seconds"),
            ],
            reasoning="This shorter routine will help you build consistency and improve completion rates.",
            priority=9
        )

    def _create_time_efficient_routine(self, features: dict) -> NewRoutineRecommendation:
        """Create a time-efficient routine"""
        return NewRoutineRecommendation(
            name="Time-Efficient Power Session",
            description="A focused workout designed to maximize results in minimal time.",
            estimated_duration=25,
            exercises=[
                Exercise(name="Thrusters", sets=4, reps=8,
                         notes="Full range of motion"),
                Exercise(name="Kettlebell Swings", sets=3,
                         reps=15, notes="Use proper form"),
                Exercise(name="Box Jumps", sets=3, reps=10,
                         notes="Step down safely"),
                Exercise(name="Battle Ropes", sets=3, reps=30,
                         notes="30 seconds on, 30 seconds rest"),
            ],
            reasoning="This routine focuses on efficiency and will help you improve time management.",
            priority=8
        )

    def _create_cardio_routine(self, features: dict) -> NewRoutineRecommendation:
        """Create a cardio-focused routine"""
        return NewRoutineRecommendation(
            name="Cardio Endurance Builder",
            description="A cardio-focused routine to improve endurance and cardiovascular fitness.",
            estimated_duration=30,
            exercises=[
                Exercise(name="Running", sets=1, reps=1,
                         notes="20 minutes steady pace"),
                Exercise(name="Jump Rope", sets=3,
                         reps=100, notes="Maintain rhythm"),
                Exercise(name="High Knees", sets=3, reps=30,
                         notes="Lift knees to hip height"),
                Exercise(name="Burpees", sets=3, reps=10,
                         notes="Full movement, maintain pace"),
            ],
            reasoning="This routine targets cardio endurance and helps build cardiovascular fitness.",
            priority=8
        )

    def _create_strength_routine(self, features: dict) -> NewRoutineRecommendation:
        """Create a strength-focused routine"""
        return NewRoutineRecommendation(
            name="Strength Foundation Builder",
            description="A strength-focused routine to build muscle and power.",
            estimated_duration=35,
            exercises=[
                Exercise(name="Deadlifts", sets=4, reps=6,
                         notes="Keep back straight"),
                Exercise(name="Bench Press", sets=4, reps=8,
                         notes="Control the weight"),
                Exercise(name="Squats", sets=4, reps=10, notes="Full depth"),
                Exercise(name="Pull-ups", sets=3, reps=8,
                         notes="Full range of motion"),
            ],
            reasoning="This routine focuses on building strength and power.",
            priority=8
        )

    def _create_balanced_routine(self, features: dict) -> NewRoutineRecommendation:
        """Create a balanced full-body routine"""
        return NewRoutineRecommendation(
            name="Full Body Blast",
            description="A balanced full-body workout targeting all major muscle groups.",
            estimated_duration=30,
            exercises=[
                Exercise(name="Burpees", sets=3,
                         reps=10, notes="Full movement"),
                Exercise(name="Push-ups", sets=3, reps=15,
                         notes="Keep core engaged"),
                Exercise(name="Squats", sets=3, reps=20, notes="Full depth"),
                Exercise(name="Plank", sets=3, reps=45,
                         notes="Hold for 45 seconds"),
                Exercise(name="Mountain Climbers", sets=3,
                         reps=20, notes="Steady pace"),
            ],
            reasoning="This balanced routine provides a complete full-body workout.",
            priority=7
        )

    def _generate_default_recommendations(self) -> RecommendationResponse:
        """Generate default recommendations when no user data is available"""
        return RecommendationResponse(
            existing_routines=[],
            new_routines=[
                self._create_balanced_routine({})
            ]
        )
