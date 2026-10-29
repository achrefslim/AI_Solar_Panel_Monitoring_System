import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BUFFER_PATH = BASE_DIR / "tmp" / "energy_buffer.json"

def load_buffer():
    if not os.path.exists(BUFFER_PATH):
        return []
    with open(BUFFER_PATH, "r") as f:
        return json.load(f)

def save_buffer(data):
    BUFFER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(BUFFER_PATH, "w") as f:
        print("Saving buffer:", data)
        json.dump(data, f)

def clear_buffer():
    if os.path.exists(BUFFER_PATH):
        os.remove(BUFFER_PATH)