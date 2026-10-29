from pathlib import Path
from typing import Dict, Any, Tuple
import os
import json
from datetime import datetime
import pandas as pd
import joblib
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config" / "config_model.json"
MODEL_PATH = BASE_DIR / "models" / "modele_production_solaire.pkl"

FIREBASE_URL = os.getenv("FIREBASE_URL")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

with CONFIG_PATH.open("r", encoding="utf-8") as f:
    CONFIG = json.load(f)

FEATURE_ORDER = CONFIG.get("features_ordre", [])
FEATURE_DETAILS: Dict[str, Dict[str, Any]] = CONFIG.get("features_details", {})

MODEL = joblib.load(MODEL_PATH)

def safe_mean(feature_name: str) -> float:
    details = FEATURE_DETAILS.get(feature_name, {})
    return float(details.get("mean", 0.0))

def build_feature_vector(feats: Dict[str, Any]) -> pd.DataFrame:
    vals = []
    missing = []
    for name in FEATURE_ORDER:
        stats = FEATURE_DETAILS.get(name, {})
        val = feats.get(name)
        if val is None:
            if "mean" in stats:
                val = stats["mean"]
            else:
                missing.append(name)
                continue
        val = float(val)
        if stats.get("min") is not None:
            val = max(stats["min"], val)
        if stats.get("max") is not None:
            val = min(stats["max"], val)
        vals.append(val)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required features without mean: {', '.join(missing)}"
        )
    return pd.DataFrame([vals], columns=FEATURE_ORDER)

def fetch_location_from_firebase() -> Tuple[float, float]:
    r = requests.get(f"{FIREBASE_URL}/location.json", timeout=10)
    r.raise_for_status()
    data = r.json()
    return float(data["lat"]), float(data["lon"])

def fetch_weather_from_api(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": WEATHER_API_KEY, "units": "metric"}
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    return r.json()

def build_features_from_weather(weather: Dict[str, Any]) -> Dict[str, Any]:
    main = weather.get("main", {})
    wind = weather.get("wind", {})
    clouds = weather.get("clouds", {})
    dt = weather.get("dt")
    temp = float(main.get("temp", safe_mean("Temperature")))
    humidity = float(main.get("humidity", safe_mean("Humidity")))
    cloud_pct = float(clouds.get("all", 0.0))
    wind_speed = float(wind.get("speed", safe_mean("Wind_Speed")))
    cloud_fraction = cloud_pct / 100.0
    solar_irradiance = 1000.0 * max(0.0, 1.0 - cloud_fraction)
    if isinstance(dt, (int, float)):
        now = datetime.utcfromtimestamp(dt)
    else:
        now = datetime.now()
    cloud_cfg = FEATURE_DETAILS.get("Cloud_Cover", {})
    cloud_max = cloud_cfg.get("max", 1.0)
    if cloud_max <= 1.5:
        cloud_value = cloud_fraction
    else:
        cloud_value = cloud_pct
    feats: Dict[str, Any] = {
        "Temperature": temp,
        "Humidity": humidity,
        "Solar_Irradiance": solar_irradiance,
        "Cloud_Cover": cloud_value,
        "Wind_Speed": wind_speed,
        "Elevation": safe_mean("Elevation"),
        "Solar_Irradiance_smooth": safe_mean("Solar_Irradiance_smooth"),
        "Solar_Production_smooth": safe_mean("Solar_Production_smooth"),
        "Efficiency_Corrected": safe_mean("Efficiency_Corrected"),
        "YEAR": now.year,
        "MONTH": now.month,
        "DAY": now.day,
        "HOUR": now.hour,
        "DAYOFWEEK": now.weekday(),
        "Temp_x_Irradiance": temp * solar_irradiance,
        "Solar_Prod_Lag1": safe_mean("Solar_Prod_Lag1"),
    }
    return feats

def predict_power_from_weather() -> Dict[str, Any]:
    lat, lon = fetch_location_from_firebase()
    weather = fetch_weather_from_api(lat, lon)
    features = build_features_from_weather(weather)
    X = build_feature_vector(features)
    pred_value = float(MODEL.predict(X)[0])
    pred_value = round(pred_value, 2)
    return {
        "prediction": pred_value,
        "features_used": features,
        "weather_raw": weather,
        "location": {"lat": lat, "lon": lon},
    }