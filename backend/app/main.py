import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import villages, forecasts, alerts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("drishti.main")

# Attempt database table creation on startup
if engine is not None:
    try:
        # Note: In production we would use Alembic migrations,
        # but create_all is ideal for rapid prototyping/MVP.
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables (PostgreSQL/PostGIS might not be fully ready): {e}")
else:
    logger.error("Database engine not initialized. Tables could not be created.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Drishti AI - India's Climate Digital Twin API Layer",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set up CORS middleware to allow the frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP, allow all origins. In production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(villages.router, prefix="/api")
app.include_router(forecasts.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify API and DB connection status."""
    db_status = "connected"
    if engine is None:
        db_status = "not_initialized"
    else:
        try:
            with engine.connect() as connection:
                connection.execute("SELECT 1")
        except Exception as e:
            db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database": db_status
    }
