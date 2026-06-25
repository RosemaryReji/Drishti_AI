import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("drishti.database")

# Setup SQLAlchemy engine
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,  # checks connection health on checkouts
        connect_args={"connect_timeout": 5}  # timeout quickly if postgres is down
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()

def get_db():
    """Dependency to get database session, closes it after request is completed."""
    if SessionLocal is None:
        raise Exception("Database engine is not initialized. Please ensure PostgreSQL is running.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
