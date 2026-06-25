import logging
from datetime import datetime, timedelta
import random
from sqlalchemy import func
from app.database import SessionLocal, engine
from app import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drishti.seed")

# List of sample Panchayats in India
SAMPLE_PANCHAYATS = [
    {
        "name": "Poonjar",
        "block": "Erattupetta",
        "district": "Kottayam",
        "pincode": "686581",
        "latitude": 9.682,
        "longitude": 76.904,
        "region_type": "mountain_monsoon"
    },
    {
        "name": "Meppadi",
        "block": "Kalpetta",
        "district": "Wayanad",
        "pincode": "673577",
        "latitude": 11.558,
        "longitude": 76.128,
        "region_type": "high_landslide"
    },
    {
        "name": "Mashobra",
        "block": "Shimla Rural",
        "district": "Shimla",
        "pincode": "171007",
        "latitude": 31.128,
        "longitude": 77.228,
        "region_type": "mountain_cold"
    },
    {
        "name": "DLF Phase 3",
        "block": "Gurgaon",
        "district": "Gurgaon",
        "pincode": "122002",
        "latitude": 28.489,
        "longitude": 77.088,
        "region_type": "urban_heatwave"
    },
    {
        "name": "Colaba",
        "block": "Mumbai City",
        "district": "Mumbai",
        "pincode": "400005",
        "latitude": 18.907,
        "longitude": 72.815,
        "region_type": "coastal_humid"
    }
]

# Sample Alert Warnings
SAMPLE_ALERTS = [
    {
        "title": "Severe Landslide & Flash Flood Warning",
        "location": "Meppadi (Wayanad District)",
        "risk_level": "SEVERE",
        "message": "Continuous heavy rainfall over 200mm expected in the next 24 hours. High risk of landslides in hilly terrains. Residents are advised to relocate to safe relief camps.",
        "pincode_match": "673577"
    },
    {
        "title": "Heatwave Orange Alert",
        "location": "Gurgaon District",
        "risk_level": "MODERATE",
        "message": "Maximum temperatures expected to touch 45°C. Avoid outdoor exposure between 12 PM and 4 PM. Keep hydrated.",
        "pincode_match": "122002"
    },
    {
        "title": "Heavy Rain & High Tide Advisory",
        "location": "Mumbai Coastal Areas",
        "risk_level": "MODERATE",
        "message": "Heavy monsoon showers coupled with a spring high tide of 4.5m expected. Avoid visiting coastal promenades. Fisherman advised not to venture into deep sea.",
        "pincode_match": "400005"
    }
]

def generate_forecast_data(panchayat_id, region_type):
    """Generate 10 days of hourly weather forecasts with regional characteristics."""
    forecasts = []
    base_time = datetime.now() - timedelta(days=1)
    
    for hour in range(240):  # 10 days * 24 hours
        timestamp = base_time + timedelta(hours=hour)
        hour_of_day = timestamp.hour
        
        # Base characteristics by region
        if region_type == "mountain_monsoon":
            # Kottayam - warm, high humidity, frequent heavy rains
            base_temp = 25.0 + 4.0 * math_sin_hour(hour_of_day)
            rain = max(0.0, random.uniform(-5.0, 15.0))  # frequent rain
            humidity = random.uniform(85, 98)
            wind_speed = random.uniform(10, 28)
            wind_dir = 240 + random.uniform(-20, 20)  # southwest monsoon
            aqi = random.randint(15, 45)
            uv = max(0, int(8 * math_sin_hour(hour_of_day)))
            
        elif region_type == "high_landslide":
            # Wayanad - cooler, extremely heavy rain in monsoon
            base_temp = 21.0 + 3.0 * math_sin_hour(hour_of_day)
            rain = max(0.0, random.uniform(-2.0, 25.0))  # heavy rain
            humidity = random.uniform(90, 100)
            wind_speed = random.uniform(12, 35)
            wind_dir = 230 + random.uniform(-15, 15)
            aqi = random.randint(10, 30)
            uv = max(0, int(6 * math_sin_hour(hour_of_day)))
            
        elif region_type == "mountain_cold":
            # Shimla - cold, pleasant, clear/misty
            base_temp = 14.0 + 5.0 * math_sin_hour(hour_of_day)
            rain = max(0.0, random.uniform(-15.0, 3.0))  # occasional light showers
            humidity = random.uniform(50, 75)
            wind_speed = random.uniform(5, 18)
            wind_dir = random.uniform(0, 360)
            aqi = random.randint(20, 50)
            uv = max(0, int(9 * math_sin_hour(hour_of_day)))
            
        elif region_type == "urban_heatwave":
            # Gurgaon - extremely hot, dry, high AQI
            base_temp = 36.0 + 7.0 * math_sin_hour(hour_of_day)
            rain = max(0.0, random.uniform(-30.0, 1.0))  # dry
            humidity = random.uniform(25, 45)
            wind_speed = random.uniform(8, 22)
            wind_dir = 270 + random.uniform(-30, 30)  # hot westerlies
            aqi = random.randint(180, 310)  # Poor to Very Poor
            uv = max(0, int(11 * math_sin_hour(hour_of_day)))
            
        else: # coastal_humid
            # Mumbai - hot, very humid, steady wind
            base_temp = 28.0 + 3.0 * math_sin_hour(hour_of_day)
            rain = max(0.0, random.uniform(-8.0, 18.0))
            humidity = random.uniform(80, 95)
            wind_speed = random.uniform(15, 32)
            wind_dir = 250 + random.uniform(-10, 10)
            aqi = random.randint(40, 85)
            uv = max(0, int(7 * math_sin_hour(hour_of_day)))

        forecast = models.Forecast(
            panchayat_id=panchayat_id,
            temperature=round(base_temp, 1),
            rainfall=round(rain, 1),
            humidity=round(humidity, 1),
            wind_speed=round(wind_speed, 1),
            wind_direction=round(wind_dir, 1),
            aqi=aqi,
            uv_index=uv,
            timestamp=timestamp
        )
        forecasts.append(forecast)
        
    return forecasts

def math_sin_hour(hour):
    """Approximates solar temperature cycles over 24 hours."""
    # Peak temp around 2-3 PM (hour 14), minimum temp around 5-6 AM (hour 5)
    import math
    return math.sin((hour - 8) * math.pi / 12)

def seed_database():
    if engine is None:
        logger.error("Cannot seed database: Connection engine not initialized.")
        return

    logger.info("Creating database tables if not exist...")
    models.Base.metadata.create_all(bind=engine)

    logger.info("Initializing database session...")
    db = SessionLocal()
    try:
        # Clear existing tables to ensure clean seed
        logger.info("Clearing existing data...")
        db.query(models.Alert).delete()
        db.query(models.Forecast).delete()
        db.query(models.Panchayat).delete()
        db.commit()

        logger.info("Seeding Indian Panchayats/Villages...")
        db_panchayats = []
        for p in SAMPLE_PANCHAYATS:
            # Create a PostGIS point for the coordinates
            geom_point = f"SRID=4326;POINT({p['longitude']} {p['latitude']})"
            db_p = models.Panchayat(
                name=p["name"],
                block=p["block"],
                district=p["district"],
                pincode=p["pincode"],
                latitude=p["latitude"],
                longitude=p["longitude"],
                region_type=p["region_type"],
                geom=geom_point
            )
            db.add(db_p)
            db.flush()  # Populates id field
            db_panchayats.append((db_p, p["region_type"]))
            
        logger.info(f"Seeded {len(db_panchayats)} panchayats.")

        logger.info("Seeding forecasts (10-day hourly datasets)...")
        for db_p, region_type in db_panchayats:
            forecasts = generate_forecast_data(db_p.id, region_type)
            db.bulk_save_objects(forecasts)
        logger.info("Seeded weather forecasts.")

        logger.info("Seeding disaster alerts...")
        for alert_data in SAMPLE_ALERTS:
            # Find matching panchayat id by pincode
            matched_p = next((p for p, _ in db_panchayats if p.pincode == alert_data["pincode_match"]), None)
            alert = models.Alert(
                title=alert_data["title"],
                location=alert_data["location"],
                risk_level=alert_data["risk_level"],
                message=alert_data["message"],
                timestamp=datetime.now(),
                panchayat_id=matched_p.id if matched_p else None
            )
            db.add(alert)
        db.commit()
        logger.info("Seeded disaster warnings.")
        logger.info("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
