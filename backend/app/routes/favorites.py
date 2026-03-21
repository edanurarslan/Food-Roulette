"""Favorite routes for Food Roulette API"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database.engine import get_db
from app.models.models import Favorite, Recipe
from app.schemas.schemas import FavoriteCreate, FavoriteResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=List[FavoriteResponse])
async def get_favorites(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's favorite recipes"""
    favorites = db.query(Favorite).filter(
        Favorite.user_id == UUID(current_user_id)
    ).all()
    
    return favorites


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    favorite_data: FavoriteCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a recipe to favorites"""
    user_id = UUID(current_user_id)
    
    # Check if recipe exists
    recipe = db.query(Recipe).filter(Recipe.id == favorite_data.recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Check if already favorited
    existing = db.query(Favorite).filter(
        (Favorite.user_id == user_id) & (Favorite.recipe_id == favorite_data.recipe_id)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe already in favorites"
        )
    
    favorite = Favorite(
        user_id=user_id,
        recipe_id=favorite_data.recipe_id
    )
    
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    return favorite


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    recipe_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a recipe from favorites"""
    favorite = db.query(Favorite).filter(
        (Favorite.user_id == UUID(current_user_id)) & (Favorite.recipe_id == recipe_id)
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return None


@router.get("/{recipe_id}", response_model=bool)
async def is_favorite(
    recipe_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if a recipe is in user's favorites"""
    favorite = db.query(Favorite).filter(
        (Favorite.user_id == UUID(current_user_id)) & (Favorite.recipe_id == recipe_id)
    ).first()
    
    return favorite is not None
