"""Users routes for profile management"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from uuid import UUID
from app.database.engine import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, UserUpdate, PasswordUpdate
from app.core.auth import hash_password, verify_password, verify_token
from app.routes.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()


@router.get("/profile", response_model=UserResponse)
async def get_profile(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user profile"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if username is already taken by another user
    if user_update.username and user_update.username != user.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check if email is already taken by another user
    if user_update.email and user_update.email != user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
    
    # Update fields
    if user_update.username:
        user.username = user_update.username
    if user_update.email:
        user.email = user_update.email
    if user_update.bio is not None:
        user.bio = user_update.bio
    if user_update.profile_image_url:
        user.profile_image_url = user_update.profile_image_url
    
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/change-password")
async def change_password(
    password_data: PasswordUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify old password
    if not verify_password(password_data.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Old password is incorrect"
        )
    
    # Verify new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Verify new password is different from old
    if verify_password(password_data.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from old password"
        )
    
    # Update password
    user.password_hash = hash_password(password_data.new_password)
    
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete: set is_active to False
    user.is_active = False
    db.commit()
    
    return {"message": "Account deleted successfully"}
