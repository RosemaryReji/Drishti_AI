from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/", response_model=List[schemas.AlertResponse])
def get_active_alerts(
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MODERATE, SEVERE)"),
    db: Session = Depends(get_db)
):
    """Retrieve active early warning climate alerts across India."""
    # Retrieve alerts created in the last 24 hours (or not expired)
    time_limit = datetime.now() - timedelta(hours=24)
    query = db.query(models.Alert).filter(models.Alert.timestamp >= time_limit)
    
    if risk_level:
        query = query.filter(models.Alert.risk_level.ilike(risk_level))
        
    return query.order_by(models.Alert.timestamp.desc()).all()

@router.get("/village/{village_id}", response_model=List[schemas.AlertResponse])
def get_village_alerts(
    village_id: int,
    db: Session = Depends(get_db)
):
    """Retrieve active early warning climate alerts for a specific Panchayat."""
    village = db.query(models.Panchayat).filter(models.Panchayat.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Panchayat not found")
        
    time_limit = datetime.now() - timedelta(hours=24)
    # Get both general alerts and village specific alerts
    alerts = db.query(models.Alert).filter(
        (models.Alert.panchayat_id == village_id) | (models.Alert.panchayat_id.is_(None)),
        models.Alert.timestamp >= time_limit
    ).order_by(models.Alert.timestamp.desc()).all()
    
    return alerts
