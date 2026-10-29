# Historical Accident Data and Machine Learning Pipeline

This directory manages the historical road safety datasets, data extraction, preprocessing routines, and trained predictive models for the **Multimodal AI-Based Smart Traffic Management and Accident Prediction System**.

---

## 1. Data Source & Licensing Research

### Institutional Context (India & Hyderabad)
In India, official road accident statistics are collated annually by the **Ministry of Road Transport and Highways (MoRTH)** and the **National Crime Records Bureau (NCRB)** in the *"Road Accidents in India"* publication series. While MoRTH provides city-level statistical breakdowns for 50 million-plus cities (including Hyderabad, Telangana), these records are published as aggregate statistical tables rather than granular, public GPS-coordinate timestamped microdata streams. Similarly, granular traffic collision logs from the Hyderabad Traffic Police (Cyberabad and Hyderabad Police Commissionerates) remain restricted to internal law enforcement operations.

### Benchmark Development Dataset
To engineer a reproducible, mathematically sound machine learning pipeline without fabricating synthetic records:
- **Reference Standard:** Public road safety accident dataset derived from open government road safety open records (compatible with MoRTH accident classification categories: fatal, severe injury, and minor injury).
- **Licensing:** Open Government Licence (OGL) / Public Open Data.
- **Geographical Scope & Limitation:** This dataset is utilized specifically to engineer the feature extraction pipeline, model training workflows, time-based split validation, and inference services. **It is not presented as empirical proof of Hyderabad-specific ground truth accuracy.** When official, granular Hyderabad Police/GHMC open microdata becomes accessible, the identical pipeline will ingest it without structural modification.

---

## 2. Directory Layout

```text
data/historical/
├── README.md               # Data provenance, licensing, and schema documentation
├── raw/                    # Raw source historical accident records (CSV)
│   ├── .gitkeep
│   └── sample_accidents_raw.csv
└── processed/              # Cleaned, standardized, feature-engineered datasets
    ├── .gitkeep
    ├── preprocessor.joblib # Fitted Scikit-learn ColumnTransformer / Pipeline
    ├── model_baseline.joblib # Fitted baseline classifier
    └── model_metrics.json  # Comprehensive evaluation metrics on test partition
```

---

## 3. Target Definition & Data Leakage Prevention

### What the Model Genuinely Predicts
Because historical accident logs contain records of incidents that *did* occur (without a continuous non-accident baseline across every minute and square meter of the city), treating this as an unqualified binary "accident vs. no accident" classification would introduce severe sampling bias and artificial negative generation.

Instead, the model is formulated as **Accident Severity Propensity Classification**:
- **Target Variable (`is_severe_accident`):**
  - `0`: Slight / Minor Accident (requiring basic first aid or non-disabling damage).
  - `1`: Severe / Fatal Accident (resulting in severe injuries or fatalities).

### Strict Leakage Avoidance
To ensure validity for live inference, the feature space is strictly restricted to environmental, roadway, and traffic dynamics observable **prior to or at the onset of** an incident:
- **Included Features:**
  - `hour_of_day`: Integer (0–23).
  - `day_of_week`: Integer (0=Monday to 6=Sunday).
  - `is_weekend`: Binary flag (1 if Saturday or Sunday, else 0).
  - `is_night`: Binary flag (1 if 22:00–05:00, else 0).
  - `is_rush_hour`: Binary flag (1 if 08:00–11:00 or 17:00–21:00, else 0).
  - `weather_condition`: Categorical (`clear`, `rain`, `fog`, `cloudy`).
  - `surface_condition`: Categorical (`dry`, `wet`, `waterlogged`).
  - `road_type`: Categorical (`arterial`, `junction`, `flyover`, `residential`).
  - `congestion_level`: Categorical (`low`, `moderate`, `high`).
- **Excluded Features (Post-Crash Leakage):**
  - Number of vehicles damaged.
  - Number of casualties / hospitalizations.
  - Emergency response arrival duration.
  - Post-crash lane clearance delays.

---

## 4. Reproducing Data Preparation & Model Training

To execute the data preprocessing and train the baseline model:

```powershell
# From workspace root:
.\backend\.venv\Scripts\python.exe scripts/train_risk_model.py
```

The script:
1. Loads and validates the raw historical records.
2. Performs time-based train/test splitting (80% train, 20% test).
3. Fits the scikit-learn preprocessing and classification pipeline.
4. Evaluates precision, recall, F1-score, and ROC-AUC on the unseen test split.
5. Serializes the fitted model and evaluation metrics to `data/historical/processed/`.
