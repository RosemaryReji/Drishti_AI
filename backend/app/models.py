from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.database import Base

class Panchayat(Base):
    __tablename__ = "panchayats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    block = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    pincode = Column(String(10), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    region_type = Column(String(50), nullable=True)
    
    # PostGIS Point column (SRID 4326 for WGS 84 GPS coordinates)
    geom = Column(Geometry(geometry_type='POINT', srid=4326), nullable=True)

    # Relationships
    forecasts = relationship("Forecast", back_populates="panchayat", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="panchayat", cascade="all, delete-orphan")


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id", ondelete="CASCADE"), nullable=False)
    temperature = Column(Float, nullable=False)
    rainfall = Column(Float, nullable=False)  # in mm
    humidity = Column(Float, nullable=False)  # percentage
    wind_speed = Column(Float, nullable=False)  # in km/h
    wind_direction = Column(Float, nullable=False)  # degrees
    aqi = Column(Integer, nullable=False)
    uv_index = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Relationships
    panchayat = relationship("Panchayat", back_populates="forecasts")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW, MODERATE, SEVERE
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False)

    # Relationships
    panchayat = relationship("Panchayat", back_populates="alerts")
