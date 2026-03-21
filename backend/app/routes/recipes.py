"""Recipe routes for Food Roulette API"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from app.database.engine import get_db
from app.models.models import Recipe, User
from app.schemas.schemas import RecipeCreate, RecipeUpdate, RecipeResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=List[RecipeResponse])
async def get_recipes(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get all recipes with optional filtering
    
    - **category**: Filter by category
    - **difficulty**: Filter by difficulty level
    - **skip**: Number of items to skip
    - **limit**: Number of items to return
    """
    query = db.query(Recipe)
    
    if category:
        query = query.filter(Recipe.category == category)
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
    
    recipes = query.offset(skip).limit(limit).all()
    return recipes


@router.get("/search", response_model=List[RecipeResponse])
async def search_recipes(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Search recipes by name or description
    
    - **q**: Search query
    """
    recipes = db.query(Recipe).filter(
        or_(
            Recipe.name.ilike(f"%{q}%"),
            Recipe.description.ilike(f"%{q}%")
        )
    ).limit(20).all()
    
    return recipes


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Get a specific recipe by ID"""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    return recipe


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_data: RecipeCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new recipe
    
    Requires authentication
    """
    new_recipe = Recipe(
        **recipe_data.dict(),
        created_by=UUID(current_user_id)
    )
    
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)
    
    return new_recipe


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: int,
    recipe_data: RecipeUpdate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a recipe
    
    Only the creator can update their recipe
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    if recipe.created_by != UUID(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own recipes"
        )
    
    update_data = recipe_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recipe, field, value)
    
    db.commit()
    db.refresh(recipe)
    
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a recipe
    
    Only the creator can delete their recipe
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    if recipe.created_by != UUID(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own recipes"
        )
    
    db.delete(recipe)
    db.commit()
    
    return None


@router.get("/categories", response_model=List[str])
async def get_categories(db: Session = Depends(get_db)):
    """Get all unique recipe categories"""
    categories = db.query(Recipe.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]
