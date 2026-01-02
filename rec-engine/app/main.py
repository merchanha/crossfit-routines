"""
FastAPI application for ML recommendation service
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from app.database.connection import get_db, check_database_connection
from app.services.recommendation_service import RecommendationService
from app.models.schemas import RecommendationRequest, RecommendationResponse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instance
recommendation_service: RecommendationService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global recommendation_service

    # Startup
    logger.info("🚀 Starting Recommendation Engine...")

    # Check database connection
    try:
        await check_database_connection()
        logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise

    # Initialize recommendation service
    try:
        recommendation_service = RecommendationService()
        logger.info("✅ Recommendation service initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize recommendation service: {e}")
        raise

    logger.info("✅ Recommendation Engine ready!")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Recommendation Engine...")


# Create FastAPI app
app = FastAPI(
    title="CrossFit Recommendation Engine",
    description="ML-powered workout routine recommendations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_status = await check_database_connection()

        return {
            "status": "healthy",
            "service": "ml-recommendations",
            "version": "1.0.0",
            "database": "connected" if db_status else "disconnected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "ml-recommendations",
            "error": str(e)
        }


@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Generate personalized workout recommendations for a user

    Args:
        request: RecommendationRequest with user_id

    Returns:
        RecommendationResponse with existing and new routine recommendations
    """
    if not recommendation_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recommendation service not initialized"
        )

    try:
        logger.info(f"Generating recommendations for user: {request.user_id}")

        # Generate recommendations
        recommendations = await recommendation_service.generate_recommendations(
            request.user_id
        )

        logger.info(
            f"✅ Generated {len(recommendations.existing_routines)} existing "
            f"and {len(recommendations.new_routines)} new recommendations"
        )

        return recommendations

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@app.get("/debug/{user_id}")
async def debug_user_data(user_id: str):
    """
    Debug endpoint to see what data is being analyzed for a user
    This helps verify the service is using real data, not mock data
    """
    if not recommendation_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Recommendation service not initialized"
        )

    try:
        import pandas as pd
        import numpy as np
        from app.services.data_preparation import (
            fetch_user_workout_data,
            fetch_user_routines,
            prepare_features_for_ml
        )

        def clean_for_json(obj):
            """Recursively clean NaN and other non-JSON values"""
            if isinstance(obj, dict):
                return {k: clean_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_for_json(item) for item in obj]
            elif isinstance(obj, (np.integer, np.floating)):
                if pd.isna(obj):
                    return None
                return float(obj) if isinstance(obj, np.floating) else int(obj)
            elif pd.isna(obj):
                return None
            elif isinstance(obj, (np.ndarray, pd.Series)):
                return clean_for_json(obj.tolist())
            return obj

        # Fetch user data
        workout_df = fetch_user_workout_data(user_id)
        routines_df = fetch_user_routines(user_id)

        # Prepare features
        features = prepare_features_for_ml(workout_df, routines_df)

        # Convert DataFrames to dict, handling NaN values
        workout_sample = []
        if not workout_df.empty:
            workout_dict = workout_df.head(3).to_dict('records')
            workout_sample = clean_for_json(workout_dict)

        routines_sample = []
        if not routines_df.empty:
            routines_dict = routines_df.head(3).to_dict('records')
            routines_sample = clean_for_json(routines_dict)

        # Clean features
        features_clean = clean_for_json(features)

        return {
            "user_id": user_id,
            "has_workout_data": not workout_df.empty,
            "has_routines": not routines_df.empty,
            "workout_count": len(workout_df) if not workout_df.empty else 0,
            "routine_count": len(routines_df) if not routines_df.empty else 0,
            "features": features_clean,
            "workout_sample": workout_sample,
            "routines_sample": routines_sample,
            "model_status": {
                "model_type": recommendation_service.model_type,
                "model_loaded": os.path.exists(recommendation_service.model_path),
                "model_trained": recommendation_service.model.is_trained if hasattr(recommendation_service.model, 'is_trained') else False
            }
        }
    except Exception as e:
        logger.error(f"Debug error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "CrossFit Recommendation Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "recommendations": "/recommendations (POST)",
            "debug": "/debug/{user_id} (GET) - See what data is analyzed"
        }
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("SERVICE_PORT", 8000))
    host = os.getenv("SERVICE_HOST", "0.0.0.0")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True
    )
