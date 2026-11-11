
from pathlib import Path
import json
import joblib
import pandas as pd

# Locate the saved model files

MODEL_DIR = Path("../reports/occupancy_classification")

# Load model and metadata
model = joblib.load(MODEL_DIR / "catboost_pipeline.joblib")

with open(MODEL_DIR / "feature_columns.json", "r") as f:
    feature_columns = json.load(f)

with open(MODEL_DIR / "class_labels.json", "r") as f:
    class_labels = json.load(f)


def predict_occupancy(sensor_features):
    # Check that all required features are provided
    missing = [
        feature for feature in feature_columns
        if feature not in sensor_features
    ]

    if missing:
        raise ValueError(f"Missing features: {missing}")

    # Arrange input features in the correct order
    input_data = pd.DataFrame(
        [[sensor_features[col] for col in feature_columns]],
        columns=feature_columns
    )

    # Run local prediction
    prediction = int(model.predict(input_data).reshape(-1)[0])

    return {
        "class_id": prediction,
        "occupancy_level": class_labels[str(prediction)]
    }
