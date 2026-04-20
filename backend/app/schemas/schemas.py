"""Pydantic schemas for request/response validation"""
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# ===== AUTH & USER SCHEMAS =====
class UserRegister(BaseModel):
    """User registration schema"""
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    bio: Optional[str] = None


class UserLogin(BaseModel):
    """User login schema"""
    username: str
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None


class PasswordUpdate(BaseModel):
    """Password update schema"""
    old_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    """User response schema"""
    id: UUID
    username: str
    email: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== RECIPE SCHEMAS =====
class RecipeCreate(BaseModel):
    """Recipe creation schema"""
    name: str = Field(..., min_length=1, max_length=255)
    emoji: Optional[str] = None
    category: str = Field(..., min_length=1)
    description: Optional[str] = None
    ingredients: List[str]
    detailed_ingredients: Optional[dict] = None
    instructions: List[str]
    cook_time: int = Field(..., gt=0)
    difficulty: Optional[str] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    tips: Optional[List[str]] = None
    image_url: Optional[str] = None


class RecipeUpdate(BaseModel):
    """Recipe update schema"""
    name: Optional[str] = None
    emoji: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None
    detailed_ingredients: Optional[dict] = None
    instructions: Optional[List[str]] = None
    cook_time: Optional[int] = None
    difficulty: Optional[str] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    tips: Optional[List[str]] = None
    image_url: Optional[str] = None


class RecipeResponse(BaseModel):
    """Recipe response schema"""
    id: int
    name: str
    emoji: Optional[str] = None
    category: str
    description: Optional[str] = None
    ingredients: List[str]
    detailed_ingredients: Optional[dict] = None
    instructions: List[str]
    cook_time: int
    difficulty: Optional[str] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    tips: Optional[List[str]] = None
    image_url: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== FAVORITE SCHEMAS =====
class FavoriteCreate(BaseModel):
    """Favorite creation schema"""
    recipe_id: int


class FavoriteResponse(BaseModel):
    """Favorite response schema"""
    id: int
    user_id: UUID
    recipe_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== HISTORY SCHEMAS =====
class HistoryCreate(BaseModel):
    """History creation schema"""
    recipe_id: int
    spin_count: int = 1


class HistoryResponse(BaseModel):
    """History response schema"""
    id: int
    user_id: UUID
    recipe_id: int
    viewed_at: datetime
    spin_count: int
    
    class Config:
        from_attributes = True


# ===== RATING SCHEMAS =====
class RatingCreate(BaseModel):
    """Rating creation schema"""
    recipe_id: int
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None


class RatingUpdate(BaseModel):
    """Rating update schema"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None


class RatingResponse(BaseModel):
    """Rating response schema"""
    id: int
    user_id: UUID
    recipe_id: int
    rating: int
    review: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== SHOPPING ITEM SCHEMAS =====
class ShoppingItemCreate(BaseModel):
    """Shopping item creation schema"""
    item_name: str = Field(..., min_length=1, max_length=255)
    recipe_id: Optional[int] = None
    amount: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = "Diğer"


class ShoppingItemUpdate(BaseModel):
    """Shopping item update schema"""
    item_name: Optional[str] = None
    amount: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    is_checked: Optional[bool] = None


class ShoppingItemResponse(BaseModel):
    """Shopping item response schema"""
    id: int
    user_id: UUID
    recipe_id: Optional[int] = None
    item_name: str
    amount: Optional[str] = None
    unit: Optional[str] = None
    category: str = "Diğer"
    is_checked: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== WEEKLY MENU SCHEMAS =====
class WeeklyMenuCreate(BaseModel):
    """Weekly menu creation schema"""
    week_start_date: date
    monday_recipe: Optional[int] = None
    tuesday_recipe: Optional[int] = None
    wednesday_recipe: Optional[int] = None
    thursday_recipe: Optional[int] = None
    friday_recipe: Optional[int] = None
    saturday_recipe: Optional[int] = None
    sunday_recipe: Optional[int] = None


class WeeklyMenuUpdate(BaseModel):
    """Weekly menu update schema"""
    monday_recipe: Optional[int] = None
    tuesday_recipe: Optional[int] = None
    wednesday_recipe: Optional[int] = None
    thursday_recipe: Optional[int] = None
    friday_recipe: Optional[int] = None
    saturday_recipe: Optional[int] = None
    sunday_recipe: Optional[int] = None


class WeeklyMenuResponse(BaseModel):
    """Weekly menu response schema"""
    id: int
    user_id: UUID
    week_start_date: date
    monday_recipe: Optional[int] = None
    tuesday_recipe: Optional[int] = None
    wednesday_recipe: Optional[int] = None
    thursday_recipe: Optional[int] = None
    friday_recipe: Optional[int] = None
    saturday_recipe: Optional[int] = None
    sunday_recipe: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ===== TOKEN & AUTH SCHEMAS =====
class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema"""
    user_id: UUID
