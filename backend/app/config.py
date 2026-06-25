import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Drishti AI"
    ENVIRONMENT: str = "development"

    # PostgreSQL + PostGIS
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "drishtipassword123"
    POSTGRES_DB: str = "drishti_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379/0"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    @property
    def DATABASE_URL(self) -> str:
        # Standard postgresql connection url for SQLAlchemy
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        # Load from .env file located in the root workspace directory
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        env_file_encoding = 'utf-8'
        extra = 'ignore'

settings = Settings()
