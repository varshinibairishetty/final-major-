"""Generates a reproducible, documented benchmark historical accident dataset.

This dataset follows standard road safety accident reporting schemas (consistent
with MoRTH road classification and OGL accident reporting structures).
It provides realistic historical records for pipeline training and evaluation.
"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Seed for full deterministic reproducibility
random.seed(42)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = WORKSPACE_ROOT / "data" / "historical" / "raw" / "sample_accidents_raw.csv"

ROAD_TYPES = ["Arterial", "Junction", "Flyover", "Residential", "Roundabout"]
ROAD_WEIGHTS = [0.35, 0.30, 0.15, 0.12, 0.08]

WEATHER_CONDITIONS = ["Clear", "Raining", "Fog or Mist", "Overcast"]
WEATHER_WEIGHTS = [0.65, 0.20, 0.05, 0.10]

SURFACE_MAP = {
    "Clear": (["Dry", "Wet"], [0.95, 0.05]),
    "Overcast": (["Dry", "Wet"], [0.85, 0.15]),
    "Raining": (["Wet", "Waterlogged"], [0.75, 0.25]),
    "Fog or Mist": (["Wet", "Dry"], [0.70, 0.30]),
}

TRAFFIC_DENSITIES = ["Low", "Moderate", "Heavy"]

# Base coordinates centered on Hyderabad metropolitan region
BASE_LAT = 17.4400
BASE_LON = 78.3800

def generate_records(num_records: int = 850):
    records = []
    start_date = datetime(2023, 1, 1, 0, 0)
    end_date = datetime(2024, 6, 30, 23, 59)
    total_seconds = int((end_date - start_date).total_seconds())

    for i in range(1, num_records + 1):
        rand_sec = random.randint(0, total_seconds)
        dt = start_date + timedelta(seconds=rand_sec)
        date_str = dt.strftime("%Y-%m-%d")
        time_str = dt.strftime("%H:%M")

        hour = dt.hour
        is_night = hour >= 22 or hour <= 5
        is_rush = (8 <= hour <= 11) or (17 <= hour <= 21)

        # Light conditions based on hour
        if 6 <= hour <= 18:
            light = "Daylight"
        else:
            light = random.choices(["Darkness - lights lit", "Darkness - no lights"], weights=[0.85, 0.15])[0]

        # Traffic density correlates with rush hour
        if is_rush:
            traffic = random.choices(TRAFFIC_DENSITIES, weights=[0.1, 0.4, 0.5])[0]
        elif is_night:
            traffic = random.choices(TRAFFIC_DENSITIES, weights=[0.75, 0.2, 0.05])[0]
        else:
            traffic = random.choices(TRAFFIC_DENSITIES, weights=[0.3, 0.5, 0.2])[0]

        road = random.choices(ROAD_TYPES, weights=ROAD_WEIGHTS)[0]

        # Speed limit
        if road in ["Flyover", "Arterial"]:
            speed_limit = random.choice([60, 80])
        elif road == "Junction":
            speed_limit = random.choice([40, 50])
        else:
            speed_limit = random.choice([30, 40])

        weather = random.choices(WEATHER_CONDITIONS, weights=WEATHER_WEIGHTS)[0]
        surf_choices, surf_weights = SURFACE_MAP[weather]
        surface = random.choices(surf_choices, weights=surf_weights)[0]

        # Severity probability based on conditions (higher at night, high speed, wet flyovers)
        severity_risk = 0.18
        if is_night:
            severity_risk += 0.12
        if speed_limit >= 80:
            severity_risk += 0.10
        if surface in ["Wet", "Waterlogged"]:
            severity_risk += 0.08
        if road == "Flyover":
            severity_risk += 0.06

        if random.random() < severity_risk:
            # Severe or Fatal
            if random.random() < 0.2:
                severity = "Fatal"
            else:
                severity = "Serious"
        else:
            severity = "Slight"

        # Coordinates around Hyderabad bounds
        lat = round(BASE_LAT + random.uniform(-0.10, 0.10), 4)
        lon = round(BASE_LON + random.uniform(-0.12, 0.12), 4)

        record = {
            "accident_id": f"HYD-ACC-{dt.year}-{i:04d}",
            "date": date_str,
            "time": time_str,
            "latitude": lat,
            "longitude": lon,
            "accident_severity": severity,
            "road_type": road,
            "speed_limit_kmh": speed_limit,
            "weather_conditions": weather,
            "road_surface_conditions": surface,
            "light_conditions": light,
            "traffic_density": traffic,
            "urban_or_rural_area": "Urban",
        }
        records.append(record)

    # Sort chronologically by date and time
    records.sort(key=lambda r: f"{r['date']} {r['time']}")
    return records


def main():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    records = generate_records(850)

    fieldnames = [
        "accident_id",
        "date",
        "time",
        "latitude",
        "longitude",
        "accident_severity",
        "road_type",
        "speed_limit_kmh",
        "weather_conditions",
        "road_surface_conditions",
        "light_conditions",
        "traffic_density",
        "urban_or_rural_area",
    ]

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} benchmark historical accident records in {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
