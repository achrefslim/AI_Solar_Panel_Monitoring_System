#include <Servo.h>

// First servomotor (original first code)
Servo myservo1;
const int servoPin1 = 9;

// Second servomotor (original second code)  
Servo myservo2;
const int servoPin2 = 10;

#define ARRET 1500
#define SENS_A 1800  
#define SENS_B 1200

const float MS_PAR_DEGRE = 4.95;
const float FACTEUR_CORRECTION = 0.92;

// VALEURS OPTIMALES CALIBRÉES pour le premier servomoteur
const int TEMPS_135_DEG = 380;    // -180° → -135° (parfait)
const int TEMPS_135_VERS_0 = 610; // -135° → 0° (parfait)

// Cycles pour les deux servomoteurs
const int anglesServo1[] = {0, 60, 120, 60, 0, -60, -120, -180, -135, 0};
const int nombreEtapesServo1 = 10;

const int anglesServo2[] = {0, 30, 0, -30, 0};
const int nombreEtapesServo2 = 5;

bool servo1Completed = false;
bool servo2Completed = false;

void setup() {
  Serial.begin(9600);
  
  // Attacher les servomoteurs
  myservo1.attach(servoPin1);
  myservo2.attach(servoPin2);
  
  // Arrêter les servomoteurs initialement
  myservo1.writeMicroseconds(ARRET);
  myservo2.writeMicroseconds(ARRET);
  delay(1000);
  
  Serial.println("=== SYSTÈME DOUBLE SERVOMOTEUR ===");
  Serial.println("Séquence: Servo1 → Cycle Complexe → Servo2 → Cycle Simple");
  Serial.println("Chaque servomoteur exécute UN SEUL cycle complet");
  delay(2000);
}

void loop() {
  static int cycleCount = 0;
  
  // Exécuter une seule fois
  if (!servo1Completed) {
    cycleCount++;
    Serial.print("--- Début Cycle Complet ");
    Serial.print(cycleCount);
    Serial.println(" ---");
    
    Serial.println(">>> SERVOMOTEUR 1 DÉMARRE");
    executerCycleServo1();
    servo1Completed = true;
    Serial.println(">>> SERVOMOTEUR 1 TERMINÉ");
    
    delay(1000); // Pause entre les servomoteurs
    
    Serial.println(">>> SERVOMOTEUR 2 DÉMARRE");
    executerCycleServo2();
    servo2Completed = true;
    Serial.println(">>> SERVOMOTEUR 2 TERMINÉ");
    
    Serial.println("--- Cycle Complet Terminé ---");
  }
  
  // Arrêter les servomoteurs après exécution
  myservo1.writeMicroseconds(ARRET);
  myservo2.writeMicroseconds(ARRET);
  
  delay(100); // Petite pause pour éviter la surcharge
}

void executerCycleServo1() {
  int positionActuelle = 0;
  
  Serial.println("Cycle Servo1: 0° → 60° → 120° → 60° → 0° → -60° → -120° → -180° → -135° → 0°");
  
  for (int i = 0; i < nombreEtapesServo1; i++) {
    int angleCible = anglesServo1[i];
    int difference = angleCible - positionActuelle;
    int tempsRotation;
    
    // APPLICATION DES VALEURS CALIBRÉES
    if (positionActuelle == -180 && angleCible == -135) {
      tempsRotation = TEMPS_135_DEG;
      Serial.print("✓ CALIBRÉ ");
    } else if (positionActuelle == -135 && angleCible == 0) {
      tempsRotation = TEMPS_135_VERS_0;
      Serial.print("✓ CALIBRÉ ");
    } else {
      // Calcul normal pour les autres étapes
      tempsRotation = calculerTempsAvecCorrection(difference);
    }
    
    Serial.print("Servo1 Étape ");
    Serial.print(i + 1);
    Serial.print("/");
    Serial.print(nombreEtapesServo1);
    Serial.print(": ");
    Serial.print(positionActuelle);
    Serial.print("° → ");
    Serial.print(angleCible);
    Serial.print("° (");
    Serial.print(tempsRotation);
    Serial.println(" ms)");
    
    if (difference > 0) {
      myservo1.writeMicroseconds(SENS_A);
    } else if (difference < 0) {
      myservo1.writeMicroseconds(SENS_B);
    }
    
    delay(tempsRotation);
    arreterServo1();
    positionActuelle = angleCible;
    
    if (i < nombreEtapesServo1 - 1) {
      delay(2000); 
    }
  }
  Serial.println("Servo1: Cycle terminé avec succès! ");
}

void executerCycleServo2() {
  int positionActuelle = 0;
  
  Serial.println("Cycle Servo2: 0° → 30° → 0° → -30° → 0°");
  
  for (int i = 0; i < nombreEtapesServo2; i++) {
    int angleCible = anglesServo2[i];
    int difference = angleCible - positionActuelle;
    int tempsRotation = calculerTempsRotation(difference);
    
    Serial.print("Servo2 Étape ");
    Serial.print(i + 1);
    Serial.print("/");
    Serial.print(nombreEtapesServo2);
    Serial.print(": ");
    Serial.print(positionActuelle);
    Serial.print("° → ");
    Serial.print(angleCible);
    Serial.print("° (");
    Serial.print(tempsRotation);
    Serial.println(" ms)");
    
    if (difference > 0) {
      myservo2.writeMicroseconds(SENS_A);
    } else if (difference < 0) {
      myservo2.writeMicroseconds(SENS_B);
    }
    
    delay(tempsRotation);
    arreterServo2();
    positionActuelle = angleCible;
    
    if (i < nombreEtapesServo2 - 1) {
      delay(1500); 
    }
  }
  Serial.println("Servo2: Cycle terminé avec succès! ");
}

int calculerTempsAvecCorrection(int differenceDegres) {
  int differenceAbsolue = abs(differenceDegres);
  float tempsBase = differenceAbsolue * MS_PAR_DEGRE;
  
  if (differenceDegres < 0) {
    return tempsBase * FACTEUR_CORRECTION;
  }
  return tempsBase;
}

int calculerTempsRotation(int differenceDegres) {
  int differenceAbsolue = abs(differenceDegres);
  float tempsBase = differenceAbsolue * MS_PAR_DEGRE;
  
  if (differenceDegres < 0) {
    return tempsBase * FACTEUR_CORRECTION;
  } else {
    return tempsBase;
  }
}

void arreterServo1() {
  myservo1.writeMicroseconds(ARRET);
}

void arreterServo2() {
  myservo2.writeMicroseconds(ARRET);
}

