from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

# --- Forecast Schemas ---
class ForecastBase(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius")
    rainfall: float = Field(..., description="Rainfall in mm")
    humidity: float = Field(..., description="Humidity percentage")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    wind_direction: float = Field(..., description="Wind direction in degrees")
    aqi: int = Field(..., description="Air Quality Index")
    uv_index: int = Field(..., description="UV Index")
    timestamp: datetime

class ForecastCreate(ForecastBase):
    pass

class ForecastResponse(ForecastBase):
    id: int
    panchayat_id: int

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertBase(BaseModel):
    title: str
    location: str
    risk_level: str  # LOW, MODERATE, SEVERE
    message: str
    timestamp: datetime

class AlertCreate(AlertBase):
    panchayat_id: Optional[int] = None

class AlertResponse(AlertBase):
    id: int
    panchayat_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Panchayat Schemas ---
class PanchayatBase(BaseModel):
    name: str
    block: str
    district: str
    pincode: str
    latitude: float
    longitude: float
    region_type: Optional[str] = None

class PanchayatCreate(PanchayatBase):
    pass

class PanchayatResponse(PanchayatBase):
    id: int
    forecasts: List[ForecastResponse] = []
    alerts: List[AlertResponse] = []

    class Config:
        from_attributes = True

class PanchayatSearchResponse(PanchayatBase):
    id: int

    class Config:
        from_attributes = True

# --- Climate Prediction Schemas ---
class DecadalProjections(BaseModel):
    temp_anomaly: float = Field(..., description="Projected decadal temperature change in Celsius")
    rain_anomaly: float = Field(..., description="Projected percentage change in monsoon rainfall")
    extreme_heat_days: int = Field(..., description="Additional extreme heat days projected per year")

class MonsoonOutlook(BaseModel):
    onset_delay_days: int = Field(..., description="Expected delay in monsoon onset in days")
    intensity_shift: str = Field(..., description="Expected intensity change description")
    drought_risk_index: float = Field(..., description="Drought risk score on scale 0.0 - 1.0")

class ClimatePredictionsResponse(BaseModel):
    village_id: int
    decadal_projections: DecadalProjections
    monsoon_outlook: MonsoonOutlook
    ai_analysis: str

