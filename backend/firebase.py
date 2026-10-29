import os
import requests
from dotenv import load_dotenv

load_dotenv()
FIREBASE_URL = os.getenv("FIREBASE_URL")

def firebase_put(path, data):
    url = f"{FIREBASE_URL}/{path}.json"
    r = requests.put(url, json=data)
    r.raise_for_status()
    return r.json()

def firebase_get(path):
    url = f"{FIREBASE_URL}/{path}.json"
    r = requests.get(url)
    r.raise_for_status()
    return r.json()

def firebase_post(path, data):
    url = f"{FIREBASE_URL}/{path}.json"
    r = requests.post(url, json=data)
    r.raise_for_status()
    return r.json()

def trim_history(path, max_len):
    current = firebase_get(path)
    ids = list(current.keys())
    
    if len(ids) >= max_len:
        first_key = ids[0]
        url = f"{FIREBASE_URL}/{path}/{first_key}.json"
        try:
            requests.delete(url)
        except Exception as e:
            print(f"Error deleting {first_key} from {path}:", e)