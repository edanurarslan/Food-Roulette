"""Pydantic schemas for request/response validation"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Recipe Schemas
class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    ingredients: str
    instructions: str
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty_level: Optional[str] = None
    image_url: Optional[str] = None


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty_level: Optional[str] = None
    image_url: Optional[str] = None


class Recipe(RecipeBase):
    id: int
    author_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Favorite Schemas
class FavoriteCreate(BaseModel):
    recipe_id: int


class Favorite(BaseModel):
    id: int
    user_id: int
    recipe_id: int
    added_at: datetime
    
    class Config:
        from_attributes = True


# Rating Schemas
class RatingCreate(BaseModel):
    recipe_id: int
    score: int
    comment: Optional[str] = None


class RatingUpdate(BaseModel):
    score: Optional[int] = None
    comment: Optional[str] = None


class Rating(BaseModel):
    id: int
    user_id: int
    recipe_id: int
    score: int
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Shopping Item Schemas
class ShoppingItemCreate(BaseModel):
    item_name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None


class ShoppingItemUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[str] = None
    unit: Optional[str] = None
    is_checked: Optional[bool] = None


class ShoppingItem(BaseModel):
    id: int
    user_id: int
    item_name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    is_checked: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Weekly Plan Schemas
class WeeklyPlanCreate(BaseModel):
    week_start_date: datetime
    day_of_week: str
    recipe_id: Optional[int] = None
    meal_type: str
    notes: Optional[str] = None


class WeeklyPlanUpdate(BaseModel):
    recipe_id: Optional[int] = None
    meal_type: Optional[str] = None
    notes: Optional[str] = None


class WeeklyPlan(BaseModel):
    id: int
    user_id: int
    week_start_date: datetime
    day_of_week: str
    recipe_id: Optional[int] = None
    meal_type: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
