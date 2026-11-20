
import json
import time
from datetime import datetime, timezone

import firebase_admin
from firebase_admin import credentials, firestore
import paho.mqtt.client as mqtt


# Firebase configuration
cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


# MQTT configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

SENSOR_TOPIC = "rit/room/+/sensors"
PREDICTION_TOPIC = "rit/room/+/predictions"

# Save historical records every 5 minutes
HISTORY_INTERVAL = 300

latest_predictions = {}
last_sensor_history_write = {}
last_prediction_history_write = {}


def save_sensor_data(room_id, payload):
    room_ref = db.collection("rooms").document(str(room_id))

    # Update the latest room state
    update_data = {
        "room_id": room_id,
        "latest_sensor_reading": payload,
        "last_sensor_update": firestore.SERVER_TIMESTAMP,
        "last_updated": firestore.SERVER_TIMESTAMP
    }

    # Include the most recent prediction if available
    if room_id in latest_predictions:
        update_data["latest_prediction"] = latest_predictions[room_id]

    room_ref.set(update_data, merge=True)

    # Save historical sensor data every 5 minutes
    now = time.time()
    last_saved = last_sensor_history_write.get(room_id, 0)

    if now - last_saved >= HISTORY_INTERVAL:
        db.collection("sensor_readings").add({
            **payload,
            "room_id": room_id,
            "received_at": firestore.SERVER_TIMESTAMP
        })

        last_sensor_history_write[room_id] = now

    print(f"Sensor data received and saved for room {room_id}")


def save_prediction_data(room_id, payload):
    latest_predictions[room_id] = payload

    # Save historical predictions every 5 minutes
    now = time.time()
    last_saved = last_prediction_history_write.get(room_id, 0)

    if now - last_saved >= HISTORY_INTERVAL:
        db.collection("predictions").add({
            **payload,
            "room_id": room_id,
            "received_at": firestore.SERVER_TIMESTAMP
        })

        last_prediction_history_write[room_id] = now

    print(f"Prediction received for room {room_id}")


def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Connected to MQTT broker")

        client.subscribe(SENSOR_TOPIC, qos=1)
        client.subscribe(PREDICTION_TOPIC, qos=1)

        print(f"Subscribed to: {SENSOR_TOPIC}")
        print(f"Subscribed to: {PREDICTION_TOPIC}")
    else:
        print(f"MQTT connection failed: {reason_code}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))

        room_id = payload["room_id"]

        if msg.topic.endswith("/sensors"):
            save_sensor_data(room_id, payload)

        elif msg.topic.endswith("/predictions"):
            save_prediction_data(room_id, payload)

    except Exception as e:
        print(f"Error processing message: {e}")


# Create MQTT client
client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="rit-firebase-bridge"
)

client.on_connect = on_connect
client.on_message = on_message


try:
    print("Starting MQTT-Firebase bridge...")

    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()

except KeyboardInterrupt:
    print("\nStopping MQTT-Firebase bridge...")

finally:
    client.disconnect()
    print("Bridge stopped.")
