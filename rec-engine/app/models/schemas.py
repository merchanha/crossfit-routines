"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class RecommendationRequest(BaseModel):
    """Request model for recommendations endpoint"""
    user_id: str = Field(..., description="User ID to generate recommendations for")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class ExistingRoutineRecommendation(BaseModel):
    """Recommendation for an existing routine"""
    routine_id: str = Field(..., description="ID of the existing routine")
    reasoning: str = Field(..., description="Why this routine is recommended")
    priority: int = Field(..., ge=1, le=10, description="Priority score (1-10, higher is better)")


class Exercise(BaseModel):
    """Exercise in a routine"""
    name: str = Field(..., description="Exercise name")
    sets: int = Field(..., ge=1, description="Number of sets")
    reps: int = Field(..., ge=1, description="Number of repetitions")
    notes: Optional[str] = Field(None, description="Additional notes")


class NewRoutineRecommendation(BaseModel):
    """Recommendation for a new AI-generated routine"""
    name: str = Field(..., description="Routine name")
    description: str = Field(..., description="Routine description")
    estimated_duration: int = Field(..., ge=1, description="Estimated duration in minutes")
    exercises: List[Exercise] = Field(..., min_items=4, max_items=8, description="List of exercises")
    reasoning: str = Field(..., description="Why this routine is recommended")
    priority: int = Field(..., ge=1, le=10, description="Priority score (1-10, higher is better)")


class RecommendationResponse(BaseModel):
    """Response model for recommendations endpoint"""
    existing_routines: List[ExistingRoutineRecommendation] = Field(
        default_factory=list,
        description="Recommendations for existing routines"
    )
    new_routines: List[NewRoutineRecommendation] = Field(
        default_factory=list,
        description="Recommendations for new AI-generated routines"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "existing_routines": [
                    {
                        "routine_id": "123e4567-e89b-12d3-a456-426614174000",
                        "reasoning": "Based on your performance, this routine matches your level",
                        "priority": 8
                    }
                ],
                "new_routines": [
                    {
                        "name": "Cardio Blast",
                        "description": "High-intensity cardio workout",
                        "estimated_duration": 30,
                        "exercises": [
                            {
                                "name": "Burpees",
                                "sets": 3,
                                "reps": 10,
                                "notes": "Keep your back straight"
                            }
                        ],
                        "reasoning": "Addresses your cardio weaknesses",
                        "priority": 9
                    }
                ]
            }
        }

