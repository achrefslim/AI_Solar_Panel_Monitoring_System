#include <Wire.h>
#include <Adafruit_INA219.h>
#include "DHT.h"
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <ESP32Servo.h>

// ========================
// WIFI CONFIGURATION
// ========================
#define WIFI_SSID "WIFI_NAME"
#define WIFI_PASSWORD "WIFI_PASSWORD"

// ========================
// FIREBASE CONFIGURATION
// ========================
#define DATABASE_URL "https://your-project-default-rtdb.region.firebasedatabase.app/"
#define DATABASE_SECRET "YOUR_DATABASE_SECRET"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ========================
// DHT CONFIGURATION
// ========================
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ========================
// INA219 SENSOR
// ========================
Adafruit_INA219 ina219;

// ========================
// SERVO CONFIGURATION
// ========================
Servo servo1;
Servo servo2;

int pinServo1 = 15;  // GPIO for servo 1
int pinServo2 = 2;   // GPIO for servo 2

// Servo 1 settings
int startAngle1 = 90;
int stepAngleForward1 = 12;
int stepAngleBackward1 = 13;
int stepDelay1 = 100;

// Servo 2 settings
int startAngle2 = 90;
int stepAngleForward2 = 10;
int stepAngleBackward2 = 13;
int stepDelay2 = 100;

int buttonPin = 0; // ESP32 internal button

// ========================
// SETUP
// ========================
void setup() {
  Serial.begin(115200);
  
  pinMode(buttonPin, INPUT_PULLUP); 
  
  // Initialize servos at start positions
  servo1.attach(pinServo1, 500, 2500);
  servo1.write(startAngle1);
  servo1.detach();
  
  servo2.attach(pinServo2, 500, 2500);
  servo2.write(startAngle2);
  servo2.detach();
  
  Serial.println("Press the internal button to start the cycle");


  // ---- INA219 ----
  if (!ina219.begin()) {
    Serial.println("Failed to find INA219 chip");
    while (1) delay(10);
  }
  ina219.setCalibration_16V_400mA();

  // ---- DHT ----
  dht.begin();

  // ---- WIFI ----
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi connected");

  // ---- FIREBASE ----
  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized");
}

void loop() {

  // =======================
  // SENSOR READINGS
  // =======================
  float busVoltage = ina219.getBusVoltage_V();
  float current_mA = ina219.getCurrent_mA();
  float power_mW = ina219.getPower_mW();
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    temperature = 0.0;
    humidity = 0.0;
  }

  Serial.println("=== Sensor Readings ===");
  Serial.print("Voltage: "); Serial.print(busVoltage, 6); Serial.println(" V");
  Serial.print("Current: "); Serial.print(current_mA, 6); Serial.println(" mA");
  Serial.print("Power: "); Serial.print(power_mW, 6); Serial.println(" mW");
  Serial.print("Temperature: "); Serial.print(temperature, 2); Serial.println(" °C");
  Serial.print("Humidity: "); Serial.print(humidity, 2); Serial.println(" %");
  Serial.println("---------------------");

  // ---- FIREBASE SEND ----
  if (Firebase.ready()) {
    String path = "/sensors";
    Firebase.setFloat(fbdo, path + "/voltage", busVoltage);
    Firebase.setFloat(fbdo, path + "/current", current_mA);
    Firebase.setFloat(fbdo, path + "/power", power_mW);
    Firebase.setFloat(fbdo, path + "/temperature", temperature);
    Firebase.setFloat(fbdo, path + "/humidity", humidity);

    if (fbdo.httpCode() == 200) {
      Serial.println("Data sent to Firebase");
    } else {
      Serial.print("Firebase error: ");
      Serial.println(fbdo.errorReason());
    }
  }

// ==========================
// SERVO BUTTON
// ==========================
static bool buttonPressedLast = false;
bool buttonPressedNow = (digitalRead(buttonPin) == LOW);

// Detect new press (LOW transition)
if (buttonPressedNow && !buttonPressedLast) {
    Serial.println("Button pressed! Starting cycle in 5 seconds...");
    delay(5000);

    // --- Servo 1 cycle ---
    Serial.println("Servo 1 starting...");
    servo1.attach(pinServo1, 500, 2500);
    for(int a = startAngle1; a <= startAngle1 + stepAngleForward1; a++) {
      servo1.write(a);
      delay(stepDelay1);
    }
    for(int a = startAngle1 + stepAngleForward1; a >= startAngle1 - stepAngleBackward1; a--) {
      servo1.write(a);
      delay(stepDelay1);
    }
    servo1.detach();
    Serial.println("Servo 1 finished");

    // --- Wait before Servo 2 ---
    Serial.println("Waiting 2 seconds before Servo 2...");
    delay(2000);

    // --- Servo 2 cycle ---
    Serial.println("Servo 2 starting...");
    servo2.attach(pinServo2, 500, 2500);
    for(int a = startAngle2; a >= startAngle2 - stepAngleForward2; a--) {
      servo2.write(a);
      delay(stepDelay2);
    }
    for(int a = startAngle2 - stepAngleForward2; a <= startAngle2 + stepAngleBackward2; a++) {
      servo2.write(a);
      delay(stepDelay2);
    }
    servo2.detach();
    Serial.println("Servo 2 finished");

    Serial.println("Final cycle completed!");
}

buttonPressedLast = buttonPressedNow;

}
