from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List
from app.database import get_db
from app import models, schemas
import logging

router = APIRouter(prefix="/villages", tags=["Villages"])
logger = logging.getLogger("drishti.routes.villages")

@router.get("/", response_model=List[schemas.PanchayatSearchResponse])
def search_villages(
    query: str = Query(None, min_length=2, description="Search by name, block, district or pincode"),
    db: Session = Depends(get_db)
):
    """Search for Panchayats/Villages in India by name, block, district, or pincode."""
    if not query:
        return db.query(models.Panchayat).limit(10).all()
        
    results = db.query(models.Panchayat).filter(
        or_(
            models.Panchayat.name.ilike(f"%{query}%"),
            models.Panchayat.block.ilike(f"%{query}%"),
            models.Panchayat.district.ilike(f"%{query}%"),
            models.Panchayat.pincode.like(f"%{query}%")
        )
    ).limit(20).all()
    
    return results

@router.get("/nearest", response_model=List[schemas.PanchayatSearchResponse])
def get_nearest_villages(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(50.0, description="Radius in kilometers"),
    db: Session = Depends(get_db)
):
    """Retrieve nearest Panchayats/Villages using geographical coordinates (using PostGIS/math fallback)."""
    try:
        # PostGIS query: SRID 4326, ST_DWithin expects distance in meters or degrees
        # ST_SetSRID(ST_Point(longitude, latitude), 4326)
        point = f"POINT({lon} {lat})"
        # 1 degree is roughly 111 km, radius_km / 111.0 converts km to degrees for flat geometry,
        # or we use geography ST_DWithin with distance in meters (radius_km * 1000)
        nearest = db.query(models.Panchayat).filter(
            func.ST_DWithin(
                models.Panchayat.geom,
                func.ST_GeomFromText(point, 4326),
                radius_km * 1000
            )
        ).order_by(
            func.ST_Distance(models.Panchayat.geom, func.ST_GeomFromText(point, 4326))
        ).limit(5).all()
        return nearest
    except Exception as e:
        logger.warning(f"PostGIS query failed, falling back to math estimation: {e}")
        # Fallback to simple square bounding box / math distance for SQLite or if PostGIS extension is missing
        # Latitude: 1 degree = 111km, Longitude: 1 degree = 111km * cos(lat)
        deg_lat = radius_km / 111.0
        deg_lon = radius_km / (111.0 * 0.8)  # estimate for Indian latitudes (approx cos(20 deg) = 0.9)
        
        nearest = db.query(models.Panchayat).filter(
            models.Panchayat.latitude.between(lat - deg_lat, lat + deg_lat),
            models.Panchayat.longitude.between(lon - deg_lon, lon + deg_lon)
        ).all()
        
        # Sort in memory by Euclidean distance
        nearest.sort(key=lambda x: (x.latitude - lat)**2 + (x.longitude - lon)**2)
        return nearest[:5]

@router.get("/{village_id}", response_model=schemas.PanchayatResponse)
def get_village_by_id(village_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed Panchayat details including forecast and alerts by ID."""
    village = db.query(models.Panchayat).filter(models.Panchayat.id == village_id).first()
    if not village:
        raise HTTPException(status_code=404, detail="Panchayat not found")
    return village
