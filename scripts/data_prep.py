"""Reproducible data preprocessing and validation pipeline for historical accident records."""

import json
from pathlib import Path
import pandas as pd

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_PATH = WORKSPACE_ROOT / "data" / "historical" / "raw" / "sample_accidents_raw.csv"
PROCESSED_DATA_PATH = WORKSPACE_ROOT / "data" / "historical" / "processed" / "accidents_clean.csv"
REPORT_PATH = WORKSPACE_ROOT / "data" / "historical" / "processed" / "data_quality_report.json"


def preprocess_accident_data(raw_csv_path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    """Loads raw accident records, validates data quality, and engineers pre-crash features."""
    if not raw_csv_path.is_file():
        raise FileNotFoundError(f"Raw historical data file not found at: {raw_csv_path}")

    df = pd.read_csv(raw_csv_path)

    # 1. Parse date and time into timestamp
    df["datetime_str"] = df["date"] + " " + df["time"]
    df["timestamp"] = pd.to_datetime(df["datetime_str"], format="%Y-%m-%d %H:%M")

    # 2. Extract temporal features
    df["hour_of_day"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek  # 0=Monday, 6=Sunday
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["is_night"] = df["hour_of_day"].apply(lambda h: 1 if h >= 22 or h <= 5 else 0)
    df["is_rush_hour"] = df["hour_of_day"].apply(lambda h: 1 if (8 <= h <= 11) or (17 <= h <= 21) else 0)

    # 3. Standardize categorical features
    df["road_type"] = df["road_type"].str.lower().str.strip()
    df["weather_condition"] = df["weather_conditions"].str.lower().str.strip()
    df["weather_condition"] = df["weather_condition"].replace({
        "fog or mist": "fog",
        "raining": "rain",
    })
    df["surface_condition"] = df["road_surface_conditions"].str.lower().str.strip()
    df["traffic_density"] = df["traffic_density"].str.lower().str.strip()

    # 4. Standardize numeric features
    df["speed_limit_kmh"] = pd.to_numeric(df["speed_limit_kmh"], errors="coerce").fillna(50)

    # 5. Define classification target: Accident Severity Propensity
    # Slight -> 0 (Minor injury or slight damage)
    # Serious / Fatal -> 1 (Severe injury or fatality)
    severity_series = df["accident_severity"].str.lower().str.strip()
    df["is_severe_accident"] = severity_series.isin(["serious", "fatal"]).astype(int)

    # 6. Chronological sort (prevent future data leakage across train/test splits)
    df = df.sort_values(by="timestamp").reset_index(drop=True)

    # Select final modeling feature set (excluding post-crash leakage features)
    feature_columns = [
        "accident_id",
        "timestamp",
        "hour_of_day",
        "day_of_week",
        "is_weekend",
        "is_night",
        "is_rush_hour",
        "speed_limit_kmh",
        "road_type",
        "weather_condition",
        "surface_condition",
        "traffic_density",
        "is_severe_accident",
    ]

    clean_df = df[feature_columns].copy()
    return clean_df


def generate_quality_report(df: pd.DataFrame) -> dict:
    """Generates summary inspection metrics on missing values, class balance, and distributions."""
    total_records = len(df)
    missing_summary = df.isnull().sum().to_dict()
    duplicates_count = int(df.duplicated(subset=["accident_id"]).sum())

    severity_counts = df["is_severe_accident"].value_counts().to_dict()
    severe_ratio = round(severity_counts.get(1, 0) / total_records, 4)

    report = {
        "dataset_inspection_date": "2026-10-29",
        "total_records": total_records,
        "date_range_start": df["timestamp"].min().strftime("%Y-%m-%d"),
        "date_range_end": df["timestamp"].max().strftime("%Y-%m-%d"),
        "duplicate_accident_ids": duplicates_count,
        "missing_values_by_column": missing_summary,
        "target_variable": "is_severe_accident",
        "class_distribution": {
            "slight_0": int(severity_counts.get(0, 0)),
            "severe_fatal_1": int(severity_counts.get(1, 0)),
            "severe_ratio": severe_ratio,
        },
        "features_included": [
            "hour_of_day",
            "day_of_week",
            "is_weekend",
            "is_night",
            "is_rush_hour",
            "speed_limit_kmh",
            "road_type",
            "weather_condition",
            "surface_condition",
            "traffic_density",
        ],
        "leakage_prevention_note": (
            "Excluded all post-crash outcome features (e.g. number of vehicles damaged, "
            "fatalities count, post-crash delay) to ensure model only evaluates pre-conditions."
        ),
    }
    return report


def main():
    PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading raw data from: {RAW_DATA_PATH}")
    clean_df = preprocess_accident_data(RAW_DATA_PATH)
    clean_df.to_csv(PROCESSED_DATA_PATH, index=False)
    print(f"Saved processed dataset ({len(clean_df)} rows) to: {PROCESSED_DATA_PATH}")

    report = generate_quality_report(clean_df)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Data quality report saved to: {REPORT_PATH}")
    print(f"Class Balance: {report['class_distribution']}")


if __name__ == "__main__":
    main()
