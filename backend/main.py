from pathlib import Path
import os
import json

import joblib
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from prediction import predict_power_from_weather

# For docs open:
#     http://127.0.0.1:8000/docs#/

load_dotenv()

FIREBASE_URL = os.getenv("FIREBASE_URL")

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config" / "config_model.json"
MODEL_PATH = BASE_DIR / "models" / "modele_production_solaire.pkl"

with CONFIG_PATH.open("r", encoding="utf-8") as f:
  CONFIG = json.load(f)

FEATURE_ORDER = CONFIG.get("features_ordre", [])
FEATURE_DETAILS = CONFIG.get("features_details", {})

MODEL = joblib.load(MODEL_PATH)


def ollama(prompt: str) -> str:
    r = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "llama2", "prompt": prompt, "stream": False}
    )
    r.raise_for_status()
    return r.json().get("response", "")


class ChatRequest(BaseModel):
    message: str


def is_prediction_intent(msg: str) -> bool:
    m = msg.lower()
    greetings = ["hello", "hi", "hey", "yo", "good morning", "good afternoon", "good evening"]
    purpose_q = ["your purpose", "who are you", "what is your purpose", "what do you do"]

    for g in greetings + purpose_q:
        if g in m:
            return False

    keywords = [
        "predict", "forecast", "estimate", "expected",
        "how much will", "how much energy", "how much power",
        "energy output", "power output", "production at",
        "power at", "energy at"
    ]

    for k in keywords:
        if k in m:
            return True

    prompt = f"""
        Classify if the user wants a solar prediction.
        Say "yes" ONLY if the message clearly asks for expected solar output.
        Otherwise say "no".

        Message: "{msg}"
        Answer:
    """
    out = ollama(prompt).strip().lower()
    return out == "yes"


def solar_assistant_prompt(msg: str) -> str:
    return f"""
        You are the Solar Assistant inside a solar dashboard.
        Answer in 1–3 short, simple sentences without emojis.
        Explain concepts clearly.

        User: {msg}
        Assistant:
    """


app = FastAPI(
    title="Solar AI Assistant + Prediction",
    version="10.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat")
def chat(req: ChatRequest):
    msg = req.message

    if not is_prediction_intent(msg):
        reply = ollama(solar_assistant_prompt(msg))
        return {"reply": reply}

    result = predict_power_from_weather()
    prediction = round((result["prediction"] * 0.00625), 2)
    weather_raw = result["weather_raw"]

    explanation_prompt = f"""
        You are the Solar Assistant.
        Answer in 1–3 short sentences without emojis.

        Prediction: {prediction} W

        Explain if this is low, normal, or high based ONLY on typical small solar 0.01 square meters module factors
        like sunlight, clouds, temperature, and shading.

        Here is the current weather data (use it for context, do not quote JSON directly):
        {json.dumps(weather_raw)}

        Assistant:
    """
    explanation = ollama(explanation_prompt)

    return {
        "prediction": prediction,
        "weather": weather_raw,
        "explanation": explanation
    }


@app.get("/prediction")
def get_prediction():
    """
    Returns only the solar power prediction based on weather + location,
    without any conversational LLM.
    """
    result = predict_power_from_weather()
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)