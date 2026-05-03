"""Push notification helpers (Expo Push)."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.engine import get_db
from app.models.models import User
from app.routes.auth import get_current_user
from app.services.push_service import send_expo_push

router = APIRouter(prefix="/notifications", tags=["notifications"])


class PushToSelfBody(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    body: str = Field(..., min_length=1, max_length=500)
    recipe_id: Optional[int] = None


class TimerCompleteBody(BaseModel):
    recipe_name: str = Field(..., min_length=1, max_length=255)
    recipe_id: Optional[int] = None


@router.post("/push")
async def push_to_self(
    payload: PushToSelfBody,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send an immediate Expo push notification to the authenticated user."""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.expo_push_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Expo push token registered for this user",
        )

    data = {}
    if payload.recipe_id is not None:
        data["recipeId"] = str(payload.recipe_id)

    result = await send_expo_push(
        [user.expo_push_token],
        title=payload.title,
        body=payload.body,
        data=data or None,
    )
    return {"status": "sent", "expo_response": result}


@router.post("/timer-complete")
async def timer_complete_push(
    payload: TimerCompleteBody,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Convenience endpoint: cooking timer finished push."""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.expo_push_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Expo push token registered for this user",
        )

    data = {}
    if payload.recipe_id is not None:
        data["recipeId"] = str(payload.recipe_id)
    data["type"] = "cooking_timer"

    result = await send_expo_push(
        [user.expo_push_token],
        title="Pişirme süresi doldu",
        body=f"{payload.recipe_name} — zamanlayıcı bitti.",
        data=data,
    )
    return {"status": "sent", "expo_response": result}
