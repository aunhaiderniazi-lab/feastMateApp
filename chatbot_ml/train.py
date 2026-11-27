import json
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_PATH = os.path.join(BASE_DIR, "intents.json")
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")


def train_model():
    with open(INTENTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = []
    labels = []
    for intent in data.get("intents", []):
        tag = intent["tag"]
        for pattern in intent.get("patterns", []):
            texts.append(pattern.lower().strip())
            labels.append(tag)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
        ("clf", LogisticRegression(max_iter=1000))
    ])
    pipeline.fit(texts, labels)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Trained on {len(texts)} samples across {len(set(labels))} intents -> saved to {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
