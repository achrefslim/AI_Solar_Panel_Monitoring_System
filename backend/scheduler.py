import time
from datetime import datetime, timedelta

from firebase import firebase_get, firebase_post, trim_history
from buffer import load_buffer, save_buffer, clear_buffer
from prediction import predict_power_from_weather

class TimeProvider:
    def __init__(self, simulate: bool = False, speed: float = 1.0):
        self.simulate = simulate
        self.speed = speed
        self._real_start = time.time()
        self._sim_start = datetime.utcnow()

    def now(self):
        if not self.simulate:
            return datetime.utcnow()
        delta_real = time.time() - self._real_start
        delta_sim = delta_real * self.speed
        return self._sim_start + timedelta(seconds=delta_sim)

USE_SIM_TIME = False
SIM_SPEED = 60

time_provider = TimeProvider(simulate=USE_SIM_TIME, speed=SIM_SPEED)

FREQUENCY = 4
INTERVAL_SECONDS = 3600 // FREQUENCY
HISTORY_LENGTH = 5

UPPER_THRESHOLD = 0.5
LOWER_THRESHOLD = 0.4

def push_alert(title: str, content: str, now: datetime):
    payload = {
        "title": title,
        "content": content,
        "time": now.strftime("%H:%M:%S")
    }
    try:
        firebase_post("alerts", payload)
    except Exception as e:
        print("firebase_post alerts error:", e)

def get_real_power():
    try:
        sensors = firebase_get("sensors")
    except Exception as e:
        print("firebase_get sensors error:", e)
        return 0

    if not isinstance(sensors, dict):
        sensors = {}

    current = sensors.get("current", 0)
    voltage = sensors.get("voltage", 0)

    try:
        current = float(current)
    except:
        current = 0
    try:
        voltage = float(voltage)
    except:
        voltage = 0

    return abs(current * voltage)

def safe_load_buffer():
    try:
        buf = load_buffer()
        if isinstance(buf, list) and all(isinstance(x, (int, float)) for x in buf):
            return buf
        raise ValueError()
    except:
        clear_buffer()
        return []

def extract_history_values(hist_snapshot):
    values = []
    if hist_snapshot is None:
        return values

    if isinstance(hist_snapshot, list):
        for v in hist_snapshot:
            try:
                if isinstance(v, dict) and "value" in v:
                    values.append(float(v["value"]))
                else:
                    values.append(float(v))
            except:
                pass
        return values

    if isinstance(hist_snapshot, dict):
        for k in sorted(hist_snapshot.keys()):
            v = hist_snapshot[k]
            try:
                if isinstance(v, dict) and "value" in v:
                    values.append(float(v["value"]))
                else:
                    values.append(float(v))
            except:
                pass

    return values

def compute_recent_average():
    try:
        hist = firebase_get("history/real")
    except:
        return None, 0

    values = extract_history_values(hist)
    if not values:
        return None, 0

    recent = values[-HISTORY_LENGTH:]
    return sum(recent) / len(recent), len(recent)

def run_scheduler_step():
    try:
        now = time_provider.now()
        real_hour = now.hour

        real_power = get_real_power()
        interval_energy = real_power * (INTERVAL_SECONDS / 3600)

        buf = safe_load_buffer()
        buf.append(interval_energy)
        save_buffer(buf)

        if len(buf) >= FREQUENCY:

            total_energy = sum(buf)
            real_val = round(total_energy, 3)

            try:
                result = predict_power_from_weather()
            except:
                result = {"prediction": 0}

            predicted_value = result.get("prediction", 0) * 0.00652
            avg_recent, count = compute_recent_average()

            if real_val == 0:
                if predicted_value > UPPER_THRESHOLD:
                    push_alert(
                        "High Prediction With Zero Output",
                        "System output is zero while expected high. Check wiring or inverter.",
                        now
                    )
            else:
                if predicted_value > real_val * (1 + UPPER_THRESHOLD):
                    push_alert(
                        "Energy Prediction Too High",
                        "Expected output much higher than real. Reduce load or check sensors.",
                        now
                    )

            if avg_recent is not None:
                if predicted_value < avg_recent * (1 - LOWER_THRESHOLD):
                    push_alert(
                        "Energy Prediction Too Low",
                        "Solar output lower than usual. Inspect panels for dirt or shading.",
                        now
                    )

            try:
                firebase_post(
                    "history/real",
                    {
                        "value": real_val,
                        "hour": real_hour
                    }
                )
            except Exception as e:
                print("firebase_post real error:", e)

            try:
                firebase_post(
                    "realHistory",
                    {
                        "power": round(real_power, 3),
                        "energy": real_val,
                        "time": now.strftime("%H:%M:%S")
                    }
                )
            except Exception as e:
                print("firebase_post realHistory error:", e)

            clear_buffer()

            try:
                trim_history("history/real", HISTORY_LENGTH)
            except Exception as e:
                print("trim_history real error:", e)

            predicted_hour = (real_hour + 1) % 24
            try:
                firebase_post(
                    "history/predicted",
                    {
                        "value": round(predicted_value, 2),
                        "hour": predicted_hour
                    }
                )
            except Exception as e:
                print("firebase_post predicted error:", e)

            try:
                trim_history("history/predicted", HISTORY_LENGTH + 1)
            except Exception as e:
                print("trim_history predicted error:", e)

    except Exception as e:
        print("run_scheduler_step crashed:", e)

def main():
    while True:
        try:
            run_scheduler_step()
        except Exception as e:
            print("Main loop step error:", e)

        if USE_SIM_TIME:
            dt = INTERVAL_SECONDS / SIM_SPEED
            if dt < 0.1:
                dt = 0.1
            time.sleep(dt)
        else:
            time.sleep(INTERVAL_SECONDS)

if __name__ == "__main__":
    main()