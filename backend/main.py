"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.database.engine import engine
from app.database.base import Base
from app.routes import auth, recipes, favorites, ratings, shopping, history, weekly, users

# Create all database tables
Base.metadata.create_all(bind=engine)

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Food Roulette - Recipe and Meal Planning API",
    version="1.0.0",
)

# Add CORS middleware FIRST (before everything else)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:3000", "http://127.0.0.1:8081", "*"],
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


# Include all routers
api_v1_prefix = settings.API_V1_STR

app.include_router(
    auth.router,
    prefix=api_v1_prefix,
    tags=["auth"]
)
app.include_router(
    users.router,
    prefix=api_v1_prefix,
    tags=["users"]
)
app.include_router(
    recipes.router,
    prefix=api_v1_prefix,
    tags=["recipes"]
)
app.include_router(
    favorites.router,
    prefix=api_v1_prefix,
    tags=["favorites"]
)
app.include_router(
    ratings.router,
    prefix=api_v1_prefix,
    tags=["ratings"]
)
app.include_router(
    shopping.router,
    prefix=api_v1_prefix,
    tags=["shopping"]
)
app.include_router(
    history.router,
    prefix=api_v1_prefix,
    tags=["history"]
)
app.include_router(
    weekly.router,
    prefix=api_v1_prefix,
    tags=["weekly-menu"]
)
