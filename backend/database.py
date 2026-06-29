# database.py - Shared DB connection configuration
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

fallback_to_sqlite = False
engine = None

if DATABASE_URL:
    try:
        logger.info("Attempting to connect to remote PostgreSQL database...")
        # Create a temporary engine with a 5-second timeout to check connection
        temp_engine = create_engine(
            DATABASE_URL, 
            connect_args={"sslmode": "require", "connect_timeout": 5},
            pool_pre_ping=True,
            pool_recycle=300
        )
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
        logger.info("Successfully connected to remote PostgreSQL database.")
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL database (error: {e}). Falling back to local SQLite.")
        fallback_to_sqlite = True

if not DATABASE_URL or fallback_to_sqlite:
    sqlite_url = "sqlite:///./smilecare.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    logger.info("Using local SQLite database: smilecare.db")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()