#!/usr/bin/env python3
"""
Migration script to add category and unit columns to shopping_items table
"""

import sys
from sqlalchemy import text
from app.database.engine import engine
from app.models.models import Base

def migrate_shopping_items():
    """Add missing columns to shopping_items table"""
    
    with engine.connect() as connection:
        # Check if columns exist
        result = connection.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='shopping_items'
        """))
        
        existing_columns = {row[0] for row in result}
        print(f"✅ Mevcut kolonlar: {existing_columns}")
        
        # Add unit column if it doesn't exist
        if 'unit' not in existing_columns:
            print("📝 'unit' kolonu ekleniyor...")
            connection.execute(text("""
                ALTER TABLE shopping_items 
                ADD COLUMN unit VARCHAR(50)
            """))
            connection.commit()
            print("✅ 'unit' kolonu başarıyla eklendi")
        else:
            print("✓ 'unit' kolonu zaten mevcut")
        
        # Add category column if it doesn't exist
        if 'category' not in existing_columns:
            print("📝 'category' kolonu ekleniyor...")
            connection.execute(text("""
                ALTER TABLE shopping_items 
                ADD COLUMN category VARCHAR(50) DEFAULT 'Diğer'
            """))
            connection.commit()
            print("✅ 'category' kolonu başarıyla eklendi")
        else:
            print("✓ 'category' kolonu zaten mevcut")
        
        # Create index for category if it doesn't exist
        try:
            connection.execute(text("""
                CREATE INDEX idx_shopping_category ON shopping_items(category)
            """))
            connection.commit()
            print("✅ 'category' index'i oluşturuldu")
        except Exception as e:
            print(f"⚠️  Index oluşturma hatası (zaten mevcut olabilir): {e}")
        
        print("\n✨ Migration tamamlandı!")
        
        # Verify columns
        result = connection.execute(text("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name='shopping_items'
            ORDER BY ordinal_position
        """))
        
        print("\n📊 shopping_items tablo yapısı:")
        print("-" * 60)
        for row in result:
            col_name, data_type, default_val = row
            default_str = f" (DEFAULT: {default_val})" if default_val else ""
            print(f"  {col_name:<15} {data_type:<20} {default_str}")
        print("-" * 60)

if __name__ == "__main__":
    try:
        migrate_shopping_items()
    except Exception as e:
        print(f"❌ Hata: {e}")
        sys.exit(1)
