"""Rating routes for Food Roulette API"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from app.database.engine import get_db
from app.models.models import Rating, Recipe
from app.schemas.schemas import RatingCreate, RatingUpdate, RatingResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["ratings"])


@router.post("/{recipe_id}/ratings", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def create_rating(
    recipe_id: int,
    rating_data: RatingCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update a rating for a recipe
    
    - **rating**: Rating value (1-5)
    - **review**: Optional review text
    """
    try:
        user_id = UUID(current_user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if recipe exists
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )
    
    # Check if rating already exists
    existing_rating = db.query(Rating).filter(
        (Rating.user_id == user_id) & (Rating.recipe_id == recipe_id)
    ).first()
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        existing_rating.review = rating_data.review
        db.commit()
        db.refresh(existing_rating)
        return existing_rating
    
    # Create new rating
    new_rating = Rating(
        user_id=user_id,
        recipe_id=recipe_id,
        rating=rating_data.rating,
        review=rating_data.review
    )
    
    try:
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        return new_rating
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save rating: {str(e)}"
        )


@router.get("/{recipe_id}/ratings", response_model=List[RatingResponse])
async def get_recipe_ratings(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """Get all ratings for a recipe"""
    ratings = db.query(Rating).filter(Rating.recipe_id == recipe_id).all()
    return ratings


@router.get("/{recipe_id}/ratings/stats")
async def get_recipe_rating_stats(recipe_id: int, db: Session = Depends(get_db)):
    """Get rating statistics for a recipe"""
    stats = db.query(
        func.count(Rating.id).label("total_ratings"),
        func.avg(Rating.rating).label("average_rating"),
        func.min(Rating.rating).label("min_rating"),
        func.max(Rating.rating).label("max_rating")
    ).filter(Rating.recipe_id == recipe_id).first()
    
    if not stats or stats.total_ratings == 0:
        return {
            "total_ratings": 0,
            "average_rating": 0,
            "min_rating": None,
            "max_rating": None
        }
    
    return {
        "total_ratings": stats.total_ratings,
        "average_rating": float(stats.average_rating) if stats.average_rating else 0,
        "min_rating": stats.min_rating,
        "max_rating": stats.max_rating
    }


@router.put("/{recipe_id}/ratings", response_model=RatingResponse)
async def update_rating(
    recipe_id: int,
    rating_data: RatingUpdate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's rating for a recipe"""
    user_id = UUID(current_user_id)
    
    rating = db.query(Rating).filter(
        (Rating.user_id == user_id) & (Rating.recipe_id == recipe_id)
    ).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    if rating_data.rating:
        rating.rating = rating_data.rating
    if rating_data.review is not None:
        rating.review = rating_data.review
    
    db.commit()
    db.refresh(rating)
    
    return rating


@router.delete("/{recipe_id}/ratings", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rating(
    recipe_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user's rating for a recipe"""
    rating = db.query(Rating).filter(
        (Rating.user_id == UUID(current_user_id)) & (Rating.recipe_id == recipe_id)
    ).first()
    
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    db.delete(rating)
    db.commit()
    
    return None
