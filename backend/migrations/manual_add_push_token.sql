-- Run once on existing PostgreSQL DB if columns are missing (SQLAlchemy create_all does not ALTER).
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_platform VARCHAR(20);
