import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:5530@localhost:5432/food_roulette_db"

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE weekly_menus ADD COLUMN menu_data JSONB;"))
            conn.commit()
            print("Successfully added menu_data column to weekly_menus table.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    migrate()
