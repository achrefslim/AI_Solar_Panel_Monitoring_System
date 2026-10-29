# Tutorial: running the AI Solar Panel Monitoring System

This guide explains how to set up every part of the system: Firebase, the ESP32 hardware, the Python backend with the prediction model, the AI assistant and the web dashboard.

## Part 1: Requirements

| Tool | Why |
|---|---|
| Python 3.10 or newer | Backend and prediction model |
| Node.js 18 or newer | Web dashboard |
| Ollama | Local AI assistant |
| Arduino IDE 2 | ESP32 firmware |
| A Google account | Firebase |
| An OpenWeatherMap account (free) | Weather data |

Hardware: ESP32, INA219 current sensor, DHT11 sensor, two servo motors, a small solar panel and a cleaning brush mechanism.

## Part 2: Firebase

1. Open the [Firebase console](https://console.firebase.google.com) and create a project.
2. In **Build** then **Realtime Database**, click **Create database**.
3. In **Build** then **Authentication**, enable **Email/Password** and **Google**.
4. In **Project settings** then **Your apps**, register a web app and keep the `firebaseConfig` values.
5. In **Project settings** then **Service accounts** then **Database secrets**, copy the database secret. It is used by the ESP32.
6. In the Realtime Database, add the location of your panel by hand:

```json
{
  "location": {
    "lat": 36.8,
    "lon": 10.18
  }
}
```

7. Rules: the backend talks to Firebase through the REST API without signing in, so for a demo the database must allow reads and writes on the paths it uses. For a real deployment, protect the database and add authentication to the backend.

## Part 3: OpenWeatherMap key

1. Create an account on [openweathermap.org](https://openweathermap.org).
2. Open **My API keys** and copy your key. A new key can take a little time before it works.

## Part 4: ESP32 hardware

### 4.1 Wiring

| Component | ESP32 pin |
|---|:---:|
| INA219 SDA | 21 |
| INA219 SCL | 22 |
| INA219 VCC and GND | 3.3 V and GND |
| Solar panel output | Through the INA219 (VIN plus and VIN minus) to the load |
| DHT11 data | 4 |
| Servo 1 signal | 15 |
| Servo 2 signal | 2 |

Power the servos from a separate 5 V supply and connect all grounds together.

### 4.2 Libraries

In the Arduino IDE:

1. Add the ESP32 boards URL `https://espressif.github.io/arduino-esp32/package_esp32_index.json` in **Preferences**, then install **esp32** in the Boards Manager.
2. In the Library Manager install: **Firebase ESP32 Client** (Mobizt), **Adafruit INA219**, **DHT sensor library** (Adafruit) and **ESP32Servo**.

### 4.3 Configure and upload

Open `arduino/netoyagecapteur/netoyagecapteur.ino` and replace the placeholders:

```cpp
#define WIFI_SSID "WIFI_NAME"
#define WIFI_PASSWORD "WIFI_PASSWORD"
#define DATABASE_URL "https://your-project-default-rtdb.region.firebasedatabase.app/"
#define DATABASE_SECRET "YOUR_DATABASE_SECRET"
```

Select your ESP32 board and port and click **Upload**. Open the Serial Monitor at **115200** baud: you should see `WiFi connected`, `Firebase initialized` and the sensor readings, followed by `Data sent to Firebase`.

### 4.4 Cleaning cycle

Press the **BOOT** button of the ESP32. After 5 seconds servo 1 moves the brush forward and back, then servo 2 does its movement. The angles and speed can be tuned at the top of the sketch (`stepAngleForward`, `stepAngleBackward`, `stepDelay`).

`arduino/coderotation/coderotation.ino` is a separate sketch for an Arduino board that runs a calibrated sequence of angles on two continuous rotation servos. Use it to test and tune the mechanism.

Never publish the sketch with your real WiFi password or database secret.

## Part 5: Backend

**Step 1.** Create a virtual environment and install the packages:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

On Linux or macOS use `source venv/bin/activate`.

**Step 2.** Copy `backend/.env.example` to `backend/.env`:

```
FIREBASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app
WEATHER_API_KEY=your openweathermap key
```

**Step 3.** Start the API:

```bash
uvicorn main:app --reload
```

Open http://127.0.0.1:8000/docs to try the endpoints. `GET /prediction` should return a prediction with the weather of your location.

**Step 4.** In a second terminal (with the virtual environment active), start the scheduler:

```bash
python scheduler.py
```

It reads the sensors every 15 minutes. Every hour it saves the real energy, predicts the next hour and pushes alerts when something looks wrong.

For a quick demo you can speed up time: in `scheduler.py` set `USE_SIM_TIME = True`. With `SIM_SPEED = 60`, one simulated hour passes every minute.

## Part 6: AI assistant (Ollama)

1. Install Ollama from [ollama.com](https://ollama.com).
2. Download the model:

```bash
ollama pull llama2
```

3. Make sure Ollama is running (`ollama serve`, or the Ollama app).

Now the `/chat` endpoint works. Examples of questions:

| Message | Result |
|---|---|
| `Hello there!` | A short introduction of the assistant |
| `Why does cloud cover reduce power?` | A simple explanation |
| `Predict my power output!` | The prediction for the current weather with a short explanation (low, normal or high) |

## Part 7: Web dashboard

**Step 1.** Install:

```bash
cd frontend
npm install
```

**Step 2.** Copy `frontend/.env.example` to `frontend/.env` and fill the Firebase values from Part 2 step 4, and your OpenWeatherMap key in `VITE_WEATHER_API_KEY`.

**Step 3.** Start:

```bash
npm run dev
```

Open http://localhost:5173.

**Step 4.** Create an account (or use **Login with Google**) and access the dashboard:

| Section | Content |
|---|---|
| Live cards | Current, voltage, power, energy, cloud cover, next hour prediction |
| Performance gauge | Real output compared with the maximum output |
| Weather card | Temperature and sky at the panel location |
| Charts | Power and energy history, real versus predicted energy |
| Export as CSV | Downloads the history |
| Alerts | Messages created by the scheduler |
| Solar Assistant | Chat with the AI (needs the backend and Ollama) |

## Part 8: Full start order

1. Power the ESP32 (sensor data starts arriving in Firebase)
2. `ollama serve`
3. `uvicorn main:app --reload` in `backend`
4. `python scheduler.py` in `backend`
5. `npm run dev` in `frontend`
6. Open http://localhost:5173

## Part 9: Troubleshooting

| Problem | Solution |
|---|---|
| `Failed to find INA219 chip` | Check the SDA and SCL wiring and the 3.3 V power of the sensor |
| `Failed to read from DHT sensor` | Check the data pin (4) and the sensor power |
| ESP32 shows a Firebase error | Check the database URL (with the final slash) and the database secret |
| `/prediction` returns an error about `lat` | Add the `/location` node in Firebase (Part 2 step 6) |
| Weather error 401 | The OpenWeatherMap key is wrong or not active yet |
| Model fails to load or shows a version warning | Install the same scikit-learn version that was used to train the model |
| Assistant does not answer | Start Ollama and pull `llama2` |
| Dashboard is empty | Check `frontend/.env` and that the ESP32 or the scheduler is writing to Firebase |
