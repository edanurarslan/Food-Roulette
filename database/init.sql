-- Food Roulette Database Creation Script
-- Created: 2026-03-15
-- Updated: With enhanced schema including UUID, JSONB, and array types

-- Create database
CREATE DATABASE food_roulette_db
    WITH
    ENCODING = 'UTF8';

-- Connect to the database
\c food_roulette_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Recipes Table
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    category VARCHAR(50) NOT NULL,
    description TEXT,
    ingredients TEXT[],
    detailed_ingredients JSONB,
    instructions TEXT[],
    cook_time INTEGER NOT NULL,
    difficulty VARCHAR(20),
    servings INTEGER,
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    tips TEXT[],
    image_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_cook_time ON recipes(cook_time);
CREATE INDEX idx_recipes_created_by ON recipes(created_by);

-- Favorites Table
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_recipe ON favorites(recipe_id);

-- History Table
CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    spin_count INTEGER DEFAULT 1
);

CREATE INDEX idx_history_user ON history(user_id);
CREATE INDEX idx_history_recipe ON history(recipe_id);

-- Shopping Items Table
CREATE TABLE shopping_items (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    amount VARCHAR(100),
    is_checked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_user ON shopping_items(user_id);
CREATE INDEX idx_shopping_recipe ON shopping_items(recipe_id);

-- Ratings Table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_recipe ON ratings(recipe_id);

-- Weekly Menus Table
CREATE TABLE weekly_menus (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    monday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    tuesday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    wednesday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    thursday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    friday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    saturday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    sunday_recipe INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_weekly_user ON weekly_menus(user_id);
CREATE INDEX idx_weekly_week_start ON weekly_menus(week_start_date);
