from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

print("[*] Loading ML models...")

split_predictor = joblib.load(os.path.join(MODEL_DIR, "split_predictor.pkl"))
preprocessor = joblib.load(os.path.join(MODEL_DIR, "preprocessor.pkl"))
label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))

print("[+] Models loaded successfully")

if hasattr(preprocessor, "feature_names_in_"):
    print("Expected columns:", list(preprocessor.feature_names_in_))
else:
    print("feature_names_in_ not available on this preprocessor")


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "ml_model"
    })

@app.post("/predict")
def predict():
    try:
        body = request.get_json()

        def calculate_bmi(height_cm, weight_kg):
            try:
                height_m = float(height_cm) / 100
                if height_m <= 0:
                    return 0
                return round(float(weight_kg) / (height_m * height_m), 2)
            except:
                return 0

        height = body.get("height", 170)
        weight = body.get("weight", 70)

        row = {
            "age": body.get("age", 22),
            "gender": body.get("gender", "Male"),
            "height": height,
            "weight": weight,
            "bmi": calculate_bmi(height, weight),
            "fitness_goal": body.get("fitness_goal", "Muscle Gain"),
            "experience_level": body.get("experience_level", "Beginner"),
            "location": body.get("location", "Gym"),
            "days_per_week": body.get("days_per_week", 4),
            "session_duration": body.get("session_duration", 60),
            "body_type": body.get("body_type", "Average"),
            "target_area": body.get("target_area", "Full Body"),
            "equipment": body.get("equipment", "Full Gym"),
            "injury": body.get("injury", "No"),
            "activity_level": body.get("activity_level", "Moderate"),
            "sleep_quality": body.get("sleep_quality", "Good"),
            "stress_level": body.get("stress_level", "Medium"),
        }

        df = pd.DataFrame([row])

        X = preprocessor.transform(df)
        pred = split_predictor.predict(X)
        label = label_encoder.inverse_transform(pred)[0]

        return jsonify({
            "success": True,
            "predicted_split": label,
            "input_used": row
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)