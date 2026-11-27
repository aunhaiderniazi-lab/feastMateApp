import os
import joblib
from flask import Flask, request, jsonify
from train import train_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")

app = Flask(__name__)

if not os.path.exists(MODEL_PATH):
    train_model()

model = joblib.load(MODEL_PATH)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None}), 200


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    message = (payload.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400

    probs = model.predict_proba([message.lower()])[0]
    best_idx = int(probs.argmax())
    intent = str(model.classes_[best_idx])
    confidence = float(probs[best_idx])

    return jsonify({
        "intent": intent,
        "confidence": round(confidence, 4)
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
