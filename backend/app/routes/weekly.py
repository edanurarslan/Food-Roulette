"""Weekly menu routes for Food Roulette API"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from uuid import UUID
from app.database.engine import get_db
from app.models.models import WeeklyMenu
from app.schemas.schemas import WeeklyMenuCreate, WeeklyMenuUpdate, WeeklyMenuResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/weekly-menu", tags=["weekly-menu"])


@router.get("/{week_start_date}", response_model=WeeklyMenuResponse)
async def get_weekly_menu(
    week_start_date: date,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly menu for a specific week"""
    menu = db.query(WeeklyMenu).filter(
        (WeeklyMenu.user_id == UUID(current_user_id)) & 
        (WeeklyMenu.week_start_date == week_start_date)
    ).first()
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly menu not found"
        )
    
    return menu


@router.post("", response_model=WeeklyMenuResponse, status_code=status.HTTP_201_CREATED)
async def create_weekly_menu(
    menu_data: WeeklyMenuCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update a weekly menu
    
    - **week_start_date**: Start date of the week (usually Monday)
    - **monday_recipe**: Recipe ID for Monday (optional)
    - **tuesday_recipe**: Recipe ID for Tuesday (optional)
    - **wednesday_recipe**: Recipe ID for Wednesday (optional)
    - **thursday_recipe**: Recipe ID for Thursday (optional)
    - **friday_recipe**: Recipe ID for Friday (optional)
    - **saturday_recipe**: Recipe ID for Saturday (optional)
    - **sunday_recipe**: Recipe ID for Sunday (optional)
    """
    user_id = UUID(current_user_id)
    
    # Check if menu already exists for this week
    existing = db.query(WeeklyMenu).filter(
        (WeeklyMenu.user_id == user_id) & 
        (WeeklyMenu.week_start_date == menu_data.week_start_date)
    ).first()
    
    if existing:
        # Update existing menu
        update_data = menu_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new menu
    new_menu = WeeklyMenu(
        user_id=user_id,
        **menu_data.dict()
    )
    
    db.add(new_menu)
    db.commit()
    db.refresh(new_menu)
    
    return new_menu


@router.put("/{week_start_date}", response_model=WeeklyMenuResponse)
async def update_weekly_menu(
    week_start_date: date,
    menu_data: WeeklyMenuUpdate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a weekly menu"""
    menu = db.query(WeeklyMenu).filter(
        (WeeklyMenu.user_id == UUID(current_user_id)) & 
        (WeeklyMenu.week_start_date == week_start_date)
    ).first()
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly menu not found"
        )
    
    update_data = menu_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(menu, field, value)
    
    db.commit()
    db.refresh(menu)
    
    return menu


@router.delete("/{week_start_date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weekly_menu(
    week_start_date: date,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a weekly menu"""
    menu = db.query(WeeklyMenu).filter(
        (WeeklyMenu.user_id == UUID(current_user_id)) & 
        (WeeklyMenu.week_start_date == week_start_date)
    ).first()
    
    if not menu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weekly menu not found"
        )
    
    db.delete(menu)
    db.commit()
    
    return None


@router.get("/current", response_model=Optional[WeeklyMenuResponse])
async def get_current_week_menu(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly menu for current week (Monday of current week)"""
    from datetime import datetime, timedelta
    
    today = date.today()
    # Get Monday of current week
    monday = today - timedelta(days=today.weekday())
    
    menu = db.query(WeeklyMenu).filter(
        (WeeklyMenu.user_id == UUID(current_user_id)) & 
        (WeeklyMenu.week_start_date == monday)
    ).first()
    
    return menu
