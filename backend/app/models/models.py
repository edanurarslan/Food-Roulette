"""SQLAlchemy models for Food Roulette application"""
from datetime import datetime
from uuid import UUID
from sqlalchemy import Column, String, Integer, Text, DECIMAL, Boolean, DateTime, ForeignKey, ARRAY, JSON, Date, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.base import Base
import uuid


class User(Base):
    """Users table"""
    __tablename__ = "users"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    profile_image_url = Column(Text)
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expo_push_token = Column(Text, nullable=True)
    push_platform = Column(String(20), nullable=True)
    
    # Relationships
    recipes = relationship("Recipe", back_populates="creator", foreign_keys="Recipe.created_by", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    history = relationship("History", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingItem", back_populates="user", cascade="all, delete-orphan")
    weekly_menus = relationship("WeeklyMenu", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_username', 'username'),
    )


class Recipe(Base):
    """Recipes table"""
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    emoji = Column(String(10))
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text)
    ingredients = Column(ARRAY(String), nullable=False)
    detailed_ingredients = Column(JSONB)
    instructions = Column(ARRAY(String), nullable=False)
    cook_time = Column(Integer, nullable=False)
    difficulty = Column(String(20), index=True)
    servings = Column(Integer)
    calories = Column(Integer)
    protein = Column(DECIMAL(5, 2))
    carbs = Column(DECIMAL(5, 2))
    fat = Column(DECIMAL(5, 2))
    tips = Column(ARRAY(String))
    image_url = Column(Text)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="recipes", foreign_keys=[created_by])
    favorites = relationship("Favorite", back_populates="recipe", cascade="all, delete-orphan")
    history = relationship("History", back_populates="recipe", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="recipe", cascade="all, delete-orphan")
    shopping_items = relationship("ShoppingItem", back_populates="recipe", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_recipes_category', 'category'),
        Index('idx_recipes_difficulty', 'difficulty'),
        Index('idx_recipes_cook_time', 'cook_time'),
        Index('idx_recipes_created_by', 'created_by'),
    )


class Favorite(Base):
    """Favorites table"""
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="favorites")
    recipe = relationship("Recipe", back_populates="favorites")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'recipe_id', name='uq_user_recipe_favorite'),
        Index('idx_favorites_user', 'user_id'),
        Index('idx_favorites_recipe', 'recipe_id'),
    )


class History(Base):
    """History table (view history)"""
    __tablename__ = "history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    spin_count = Column(Integer, default=1)
    
    # Relationships
    user = relationship("User", back_populates="history")
    recipe = relationship("Recipe", back_populates="history")
    
    __table_args__ = (
        Index('idx_history_user', 'user_id'),
        Index('idx_history_recipe', 'recipe_id'),
    )


class Rating(Base):
    """Ratings table"""
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    review = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="ratings")
    recipe = relationship("Recipe", back_populates="ratings")
    
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='ck_rating_range'),
        UniqueConstraint('user_id', 'recipe_id', name='uq_user_recipe_rating'),
        Index('idx_ratings_user', 'user_id'),
        Index('idx_ratings_recipe', 'recipe_id'),
    )


class ShoppingItem(Base):
    """Shopping Items table"""
    __tablename__ = "shopping_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True)
    item_name = Column(String(255), nullable=False)
    amount = Column(String(100))
    unit = Column(String(50))
    category = Column(String(50), default="Diğer")
    is_checked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="shopping_items")
    recipe = relationship("Recipe", back_populates="shopping_items")
    
    __table_args__ = (
        Index('idx_shopping_user', 'user_id'),
        Index('idx_shopping_recipe', 'recipe_id'),
    )


class WeeklyMenu(Base):
    """Weekly Menus table"""
    __tablename__ = "weekly_menus"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start_date = Column(Date, nullable=False)
    monday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    tuesday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    wednesday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    thursday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    friday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    saturday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    sunday_recipe = Column(Integer, ForeignKey("recipes.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="weekly_menus")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'week_start_date', name='uq_user_week'),
        Index('idx_weekly_user', 'user_id'),
        Index('idx_weekly_week_start', 'week_start_date'),
    )
