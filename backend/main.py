"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.database.engine import engine
from app.database.base import Base

# Create all database tables
Base.metadata.create_all(bind=engine)

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Food Roulette - Recipe and Meal Planning API",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Food Roulette API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# TODO: Import and include routers here
# from app.routes import users, recipes, favorites, ratings, shopping, weekly_plan
# app.include_router(users.router, prefix=settings.API_V1_STR + "/users", tags=["users"])
# app.include_router(recipes.router, prefix=settings.API_V1_STR + "/recipes", tags=["recipes"])
