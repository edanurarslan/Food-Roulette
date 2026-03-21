"""History routes for Food Roulette API"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from uuid import UUID
from app.database.engine import get_db
from app.models.models import History
from app.schemas.schemas import HistoryCreate, HistoryResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[HistoryResponse])
async def get_history(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """
    Get user's recipe view history
    
    - **limit**: Maximum number of items to return
    """
    history = db.query(History).filter(
        History.user_id == UUID(current_user_id)
    ).order_by(desc(History.viewed_at)).limit(limit).all()
    
    return history


@router.post("", response_model=HistoryResponse, status_code=status.HTTP_201_CREATED)
async def add_to_history(
    history_data: HistoryCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add or update recipe in view history
    
    - **recipe_id**: ID of the recipe
    - **spin_count**: Number of times recipe was spun (default: 1)
    """
    user_id = UUID(current_user_id)
    
    # Check if already in history
    existing = db.query(History).filter(
        (History.user_id == user_id) & (History.recipe_id == history_data.recipe_id)
    ).first()
    
    if existing:
        # Update spin count
        existing.spin_count += history_data.spin_count
        from sqlalchemy import func
        existing.viewed_at = func.now()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new history entry
    new_history = History(
        user_id=user_id,
        **history_data.dict()
    )
    
    db.add(new_history)
    db.commit()
    db.refresh(new_history)
    
    return new_history


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_history(
    recipe_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a recipe from view history"""
    history = db.query(History).filter(
        (History.user_id == UUID(current_user_id)) & (History.recipe_id == recipe_id)
    ).first()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found"
        )
    
    db.delete(history)
    db.commit()
    
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear entire view history"""
    db.query(History).filter(
        History.user_id == UUID(current_user_id)
    ).delete()
    
    db.commit()
    
    return None
