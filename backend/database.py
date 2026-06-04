import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Dynamically pick the Neon live environment URL or fallback to local container database
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local fallback parameters if running locally outside production
    db_user = os.getenv("DB_USER", "user")
    db_password = os.getenv("DB_PASSWORD", "secret_secure_password")
    db_name = os.getenv("DB_NAME", "inventory_db")
    DATABASE_URL = f"postgresql://{db_user}:{db_password}@db:5432/{db_name}"

# Neon requires an active SSL connection. We handle that cleanly here:
if "neon.tech" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    pool_size=5,          # Low pool size keeps connections lightweight on Neon free tier
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()