"""Shopping list routes for Food Roulette API"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database.engine import get_db
from app.models.models import ShoppingItem
from app.schemas.schemas import ShoppingItemCreate, ShoppingItemUpdate, ShoppingItemResponse
from app.routes.auth import get_current_user

router = APIRouter(prefix="/shopping", tags=["shopping"])


@router.get("", response_model=List[ShoppingItemResponse])
async def get_shopping_list(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
    only_unchecked: bool = False
):
    """
    Get user's shopping list
    
    - **only_unchecked**: If True, only return unchecked items
    """
    query = db.query(ShoppingItem).filter(
        ShoppingItem.user_id == UUID(current_user_id)
    )
    
    if only_unchecked:
        query = query.filter(ShoppingItem.is_checked == False)
    
    items = query.all()
    print(f"🛒 [Shopping] {len(items)} item yüklendi - Kategoriler: {[item.category for item in items]}")
    return items


@router.post("", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
async def add_shopping_item(
    item_data: ShoppingItemCreate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add an item to shopping list
    
    - **item_name**: Name of the item
    - **amount**: Quantity (e.g., "2 cups", "500g")
    - **category**: Category (Sebze, Meyve, vs.)
    - **recipe_id**: Optional recipe ID if item is from a recipe
    """
    # Normalize category - trim whitespace
    category = (item_data.category or "Diğer").strip()
    
    print(f"📝 [Shopping] Yeni item ekleniyor: {item_data.item_name} (Kategori: '{category}')")
    
    new_item = ShoppingItem(
        user_id=UUID(current_user_id),
        item_name=item_data.item_name,
        recipe_id=item_data.recipe_id,
        amount=item_data.amount,
        unit=item_data.unit,
        category=category,
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    print(f"✅ [Shopping] Item başarıyla eklendi: ID={new_item.id}, name={new_item.item_name}, category='{new_item.category}'")
    return new_item


@router.put("/{item_id}", response_model=ShoppingItemResponse)
async def update_shopping_item(
    item_id: int,
    item_data: ShoppingItemUpdate,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a shopping list item"""
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping item not found"
        )
    
    if item.user_id != UUID(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own items"
        )
    
    update_data = item_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shopping_item(
    item_id: int,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a shopping list item"""
    item = db.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping item not found"
        )
    
    if item.user_id != UUID(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own items"
        )
    
    db.delete(item)
    db.commit()
    
    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_checked_items(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all checked items from shopping list"""
    db.query(ShoppingItem).filter(
        (ShoppingItem.user_id == UUID(current_user_id)) & 
        (ShoppingItem.is_checked == True)
    ).delete()
    
    db.commit()
    
    return None
