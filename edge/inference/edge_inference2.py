import paho.mqtt.client as mqtt
import random
import time
import math
import json
import csv
import os

import pandas as pd
from datetime import datetime, timedelta
from catboost import CatBoostClassifier, CatBoostRegressor


# ==========================================
# CONFIGURATION
# ==========================================

ROOM = 1
CAPACITY = 32
IS_LECTURE = 0

SIMULATION_INTERVAL_SECONDS = 5

LOG_FILE = "edge_predictions.csv"

# Initial synthetic sensor values
occupancy = 0
co2 = 420.0
temperature = 24.0
humidity = 45.0
illuminance = 100.0

# MQTT CONFIGURATION
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

SENSOR_TOPIC = f"rit/room/{ROOM}/sensors"
PREDICTION_TOPIC = f"rit/room/{ROOM}/predictions"

mqtt_client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="rit-occupancy-edge"
)
# ==========================================
# LOAD FEATURE LIST AND MODELS
# ==========================================

with open("rit_feature_list.json", "r") as f:
    feature_cols = json.load(f)

classifier = CatBoostClassifier()
classifier.load_model("catboost_rit_39_features.cbm")

regressor = CatBoostRegressor()
regressor.load_model("catboost_regression_39_features.cbm")

class_names = {
    0: "Empty",
    1: "Low",
    2: "Moderate",
    3: "High",
    4: "Very high"
}


# ==========================================
# INITIALIZE SIMULATION
# ==========================================

history = []
simulation_start = datetime.now()

step = 0

# Create a fresh CSV file for each simulation run
log_file = open(LOG_FILE, "w", newline="")
log_writer = csv.writer(log_file)

log_writer.writerow([
    "timestamp",
    "room",
    "capacity",
    "occupancy",
    "co2",
    "temperature",
    "humidity",
    "illuminance",
    "predicted_class",
    "predicted_occupancy_ratio",
    "predicted_people_30min"
])

log_file.flush()


# ==========================================
# SYNTHETIC SENSOR GENERATION
# ==========================================

def generate_sensor_readings(step):

    global occupancy, co2, temperature, humidity, illuminance

    phase = step % 30

    # Simulate occupancy patterns
    if phase < 10:
        occupancy = min(
            CAPACITY,
            occupancy + random.randint(1, 3)
        )

    elif phase < 20:
        occupancy = max(
            0,
            min(CAPACITY, occupancy + random.randint(-1, 1))
        )

    else:
        occupancy = max(
            0,
            occupancy - random.randint(1, 3)
        )

    # Simulate environmental sensor readings
    co2 += occupancy * 0.25 - 2.5 + random.uniform(-3, 3)
    co2 = max(400, min(1500, co2))

    temperature += random.uniform(-0.08, 0.08)

    humidity += random.uniform(-0.2, 0.2)

    illuminance = max(
        0,
        100 + occupancy * 15 + random.uniform(-20, 20)
    )

    timestamp = simulation_start + timedelta(minutes=5 * step)

    return {
        "timestamp": timestamp,
        "occ": occupancy,
        "co2": co2,
        "temperature": temperature,
        "humidity": humidity,
        "illuminance": illuminance
    }


# ==========================================
# FEATURE ENGINEERING
# ==========================================

def generate_features(readings):

    current = readings[-1]

    features = {}

    # Occupancy features
    features["occ"] = current["occ"]

    for lag in [1, 2, 3, 6]:
        features[f"occ_lag{lag}"] = readings[-1-lag]["occ"]

    features["occ_ratio"] = current["occ"] / CAPACITY

    # Environmental sensor features
    for sensor in ["co2", "temperature", "humidity", "illuminance"]:

        features[sensor] = current[sensor]

        for lag in [1, 2, 3, 6]:
            features[f"{sensor}_lag{lag}"] = readings[-1-lag][sensor]

    # Sensor differences
    for sensor in ["co2", "temperature", "humidity"]:
        features[f"{sensor}_diff"] = (
            current[sensor] - readings[-2][sensor]
        )

    # Sensor age (seconds)
    features["co2_age"] = 0
    features["temperature_age"] = 0
    features["humidity_age"] = 0
    features["illuminance_age"] = 0

    # Time features
    hour = current["timestamp"].hour + current["timestamp"].minute / 60

    features["hour_sin"] = math.sin(2 * math.pi * hour / 24)
    features["hour_cos"] = math.cos(2 * math.pi * hour / 24)

    features["month"] = current["timestamp"].month

    # Room metadata
    features["room"] = ROOM
    features["capacity"] = CAPACITY
    features["is_lecture"] = IS_LECTURE

    # Ensure exact model feature order
    feature_row = pd.DataFrame(
        [[features[col] for col in feature_cols]],
        columns=feature_cols
    )

    return feature_row

# ==========================================
# MQTT PUBLISHING
# ==========================================

def publish_mqtt(topic, payload):

    message = json.dumps(payload)

    result = mqtt_client.publish(
        topic,
        message,
        qos=1
    )

    result.wait_for_publish()
# ==========================================
# MAIN MONITORING LOOP
# ==========================================

print("=" * 50)
print("RIT EDGE AI OCCUPANCY MONITORING")
print("=" * 50)

print("Device: Raspberry Pi 5")
print("Input: Synthetic sensor readings")
print("Simulation interval:", SIMULATION_INTERVAL_SECONDS, "seconds")
print("CSV output:", LOG_FILE)
print("Model features:", len(feature_cols))
print("\nMonitoring started. Press Ctrl+C to stop.\n")

# Connect to local MQTT broker
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.loop_start()

print("Connected to MQTT broker:", MQTT_BROKER)

try:
    while True:

        # Generate new sensor readings
        reading = generate_sensor_readings(step)
        history.append(reading)

        # Publish sensor telemetry
        sensor_message = {
            "room_id": ROOM,
            "capacity": CAPACITY,
            "timestamp": reading["timestamp"].isoformat(),
            "generated_at": datetime.now().isoformat(),
            "occupancy": reading["occ"],
            "co2": round(reading["co2"], 2),
            "temperature": round(reading["temperature"], 2),
            "humidity": round(reading["humidity"], 2),
            "illuminance": round(reading["illuminance"], 2)
        }

        publish_mqtt(SENSOR_TOPIC, sensor_message)

        print("-" * 50)
        print("Reading:", step + 1)
        print("Timestamp:", reading["timestamp"])
        print("Occupancy:", reading["occ"])
        print("CO2:", round(reading["co2"], 2), "ppm")
        print("Temperature:", round(reading["temperature"], 2), "°C")
        print("Humidity:", round(reading["humidity"], 2), "%")
        print("Illuminance:", round(reading["illuminance"], 2), "lux")

        # Default prediction values during warm-up
        predicted_class = ""
        predicted_ratio = ""
        predicted_people = ""

        # Wait until seven readings are available
        if len(history) >= 7:

            feature_row = generate_features(history)

            # Classification prediction
            classification_prediction = classifier.predict(
                feature_row,
                thread_count=1
            )

            # Regression prediction
            regression_prediction = regressor.predict(
                feature_row,
                thread_count=1
            )

            predicted_class = class_names[
                int(classification_prediction[0][0])
            ]

            predicted_ratio = float(regression_prediction[0])
            predicted_people = predicted_ratio * CAPACITY

            print("\nEDGE AI PREDICTIONS")
            print("Predicted occupancy class:", predicted_class)
            print("Predicted occupancy ratio:", round(predicted_ratio, 4))
            print(
                "Estimated people in 30 minutes:",
                round(predicted_people, 2)
            )
            print("Model input shape:", feature_row.shape)

            # Publish edge AI predictions
            prediction_message = {
                "room_id": ROOM,
                "timestamp": reading["timestamp"].isoformat(),
                "generated_at": datetime.now().isoformat(),
                "prediction_horizon_minutes": 30,
                "predicted_class": predicted_class,
                "predicted_occupancy_ratio": round(predicted_ratio, 4),
                "predicted_people": round(predicted_people, 2)
            }

            publish_mqtt(PREDICTION_TOPIC, prediction_message)

        else:
            print(
                "\nCollecting historical readings:",
                f"{len(history)}/7"
            )

        # Save every reading to CSV
        log_writer.writerow([
            reading["timestamp"].isoformat(),
            ROOM,
            CAPACITY,
            reading["occ"],
            round(reading["co2"], 2),
            round(reading["temperature"], 2),
            round(reading["humidity"], 2),
            round(reading["illuminance"], 2),
            predicted_class,
            round(predicted_ratio, 4) if predicted_ratio != "" else "",
            round(predicted_people, 2) if predicted_people != "" else ""
        ])

        log_file.flush()

        step += 1
        time.sleep(SIMULATION_INTERVAL_SECONDS)

except KeyboardInterrupt:
    print("\n\nMonitoring stopped.")
    print("Total readings generated:", len(history))
    print("CSV saved to:", os.path.abspath(LOG_FILE))

finally:
    log_file.close()
    mqtt_client.loop_stop()
    mqtt_client.disconnect()
    print("MQTT connection closed.")

