"""Reproducible training and evaluation pipeline for accident severity risk prediction."""

import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
CLEAN_DATA_PATH = WORKSPACE_ROOT / "data" / "historical" / "processed" / "accidents_clean.csv"
MODEL_SAVE_PATH = WORKSPACE_ROOT / "data" / "historical" / "processed" / "model_baseline.joblib"
BACKEND_MODEL_DIR = WORKSPACE_ROOT / "backend" / "app" / "models"
BACKEND_MODEL_PATH = BACKEND_MODEL_DIR / "model_baseline.joblib"
METRICS_SAVE_PATH = WORKSPACE_ROOT / "data" / "historical" / "processed" / "model_metrics.json"

NUMERIC_FEATURES = [
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "is_night",
    "is_rush_hour",
    "speed_limit_kmh",
]

CATEGORICAL_FEATURES = [
    "road_type",
    "weather_condition",
    "surface_condition",
    "traffic_density",
]


def train_and_evaluate_model():
    """Trains a baseline severity model using a time-based train/test split."""
    if not CLEAN_DATA_PATH.is_file():
        raise FileNotFoundError(f"Processed data not found at {CLEAN_DATA_PATH}. Run scripts/data_prep.py first.")

    df = pd.read_csv(CLEAN_DATA_PATH)
    # Ensure chronological order
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by="timestamp").reset_index(drop=True)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["is_severe_accident"]

    # Time-based train/test split (80% train, 20% test)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    train_dates = (df["timestamp"].iloc[0].strftime("%Y-%m-%d"), df["timestamp"].iloc[split_idx - 1].strftime("%Y-%m-%d"))
    test_dates = (df["timestamp"].iloc[split_idx].strftime("%Y-%m-%d"), df["timestamp"].iloc[-1].strftime("%Y-%m-%d"))

    # Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES),
        ]
    )

    # Classification pipeline with balanced class weights
    rf_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=100,
                    max_depth=5,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )

    rf_pipeline.fit(X_train, y_train)

    # Predictions on test set
    y_pred = rf_pipeline.predict(X_test)
    y_proba = rf_pipeline.predict_proba(X_test)[:, 1]

    # Evaluation metrics
    acc = accuracy_score(y_test, y_pred)
    prec_severe = precision_score(y_test, y_pred, pos_label=1, zero_division=0)
    rec_severe = recall_score(y_test, y_pred, pos_label=1, zero_division=0)
    f1_severe = f1_score(y_test, y_pred, pos_label=1, zero_division=0)
    f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "model_name": "RandomForest_SeverityBaseline",
        "training_date": "2026-10-29",
        "target_definition": "is_severe_accident (0=Slight/Minor, 1=Serious/Fatal)",
        "split_method": "Time-based 80/20 split (strictly ordered by timestamp)",
        "train_set": {
            "records": len(X_train),
            "date_range": train_dates,
            "severe_class_count": int(y_train.sum()),
            "slight_class_count": int((y_train == 0).sum()),
        },
        "test_set": {
            "records": len(X_test),
            "date_range": test_dates,
            "severe_class_count": int(y_test.sum()),
            "slight_class_count": int((y_test == 0).sum()),
        },
        "test_metrics": {
            "accuracy": round(float(acc), 4),
            "precision_severe_class": round(float(prec_severe), 4),
            "recall_severe_class": round(float(rec_severe), 4),
            "f1_score_severe_class": round(float(f1_severe), 4),
            "f1_macro": round(float(f1_macro), 4),
            "roc_auc": round(float(roc_auc), 4),
            "confusion_matrix": {
                "tn": cm[0][0],
                "fp": cm[0][1],
                "fn": cm[1][0],
                "tp": cm[1][1],
            },
        },
        "input_features": {
            "numeric": NUMERIC_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
        },
        "evaluation_verdict": (
            f"Achieved ROC-AUC of {roc_auc:.3f} and F1-macro of {f1_macro:.3f} on the held-out "
            "test partition under class imbalance (~25% severe cases)."
        ),
    }

    # Save artifacts
    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf_pipeline, MODEL_SAVE_PATH)
    print(f"Saved fitted model artifact to: {MODEL_SAVE_PATH}")

    BACKEND_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf_pipeline, BACKEND_MODEL_PATH)
    print(f"Copied model artifact for backend service to: {BACKEND_MODEL_PATH}")

    with open(METRICS_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved evaluation metrics to: {METRICS_SAVE_PATH}")

    print("\n--- Test Partition Performance ---")
    print(f"Accuracy: {acc:.4f}")
    print(f"ROC-AUC:  {roc_auc:.4f}")
    print(f"F1 (Severe Class): {f1_severe:.4f}")
    print(f"Recall (Severe Class): {rec_severe:.4f}")
    print(f"Confusion Matrix: {cm}")
    return metrics


if __name__ == "__main__":
    train_and_evaluate_model()
