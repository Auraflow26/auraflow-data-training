#!/usr/bin/env python3
"""
AuraFlow — XGBoost Foundation Score Model Training

Trains an XGBoost regressor to predict foundation_score (0-100) from 163
business diagnostic features. Designed for small-sample regime (n=150, p=163)
with strong regularization and repeated cross-validation.

Usage:
    pip install -r requirements-ml.txt
    python src/scripts/ml-training/train-xgboost.py

Input:  ml-data/training_data_v1.csv  (from extract-training-data.ts)
Output: ml-data/models/foundation_score_v1.json
        ml-data/models/foundation_score_v1_metadata.json
        ml-data/splits/split_v1.json
"""

import json
import os
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import (
    GridSearchCV,
    RepeatedKFold,
    train_test_split,
)
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.preprocessing import LabelEncoder

# ─── Constants ────────────────────────────────────────────────────────────────

SEED = 42
TEST_SIZE = 0.15
CSV_PATH = "ml-data/training_data_v1.csv"
MODEL_DIR = "ml-data/models"
SPLITS_DIR = "ml-data/splits"

# Meta columns — NOT features. health_level/size_band leak target info.
META_COLUMNS = ["dataset_id", "company_name", "vertical", "size_band", "health_level"]
TARGET_COLUMN = "target_foundation_score"

# Foundation score tier boundaries
TIER_BOUNDARIES = [
    (0, 25, "Critical Infrastructure Gaps"),
    (26, 50, "Significant Gaps"),
    (51, 70, "Functional, Inefficient"),
    (71, 85, "Strong Foundation"),
    (86, 100, "Optimized"),
]

# Critical features (weight >= 3 in scoring engine) — used to flag in importance report
CRITICAL_FEATURES = {
    "f_website_exists",
    "f_mobile_responsive",
    "f_monthly_lead_volume",
    "f_cost_per_lead",
    "f_lead_response_time_min",
    "f_after_hours_capture_method",
    "f_phone_answer_rate",
    "f_follow_up_sequence_exists",
    "f_time_to_first_follow_up_hrs",
    "f_lead_to_appointment_cvr",
    "f_appointment_to_close_rate",
    "f_google_ads_conversion_tracking",
    "f_overall_roas",
    "f_gbp_claimed",
    "f_google_reviews_count",
    "f_google_rating",
    "f_review_response_rate",
    "f_connected_tools",
    "f_manual_data_entry_hrs_week",
    "f_owner_admin_hrs_week",
    "f_could_handle_2x_volume",
    "f_single_point_of_failure",
    "f_owner_hrs_week_in",
    "f_team_ops_without_owner_days",
}

# Hyperparameter search grid — deliberately small for n=150
PARAM_GRID = {
    "max_depth": [3, 4, 5],
    "learning_rate": [0.05, 0.1],
    "n_estimators": [100, 200, 300],
    "reg_alpha": [0.5, 1.0, 2.0],
    "reg_lambda": [3.0, 5.0, 10.0],
    "min_child_weight": [5, 10],
}

# Fixed params (not tuned)
FIXED_PARAMS = {
    "objective": "reg:squarederror",
    "subsample": 0.8,
    "colsample_bytree": 0.6,
    "random_state": SEED,
    "verbosity": 0,
}


# ─── Functions ────────────────────────────────────────────────────────────────


def load_data(csv_path: str) -> pd.DataFrame:
    """Load the training CSV produced by extract-training-data.ts."""
    path = Path(csv_path)
    if not path.exists():
        print(f"  CSV not found at: {path.resolve()}")
        print("  Run: npx tsx src/scripts/ml-prep/extract-training-data.ts")
        sys.exit(1)

    df = pd.read_csv(csv_path)
    print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")
    return df


def preprocess(df: pd.DataFrame) -> tuple:
    """
    Separate meta/features/target, label-encode string categoricals.

    Returns: (X, y, meta_df, encoders_dict, feature_names)
    """
    # Separate target
    if TARGET_COLUMN not in df.columns:
        print(f"  Target column '{TARGET_COLUMN}' not found.")
        print(f"  Available columns: {list(df.columns[:10])}...")
        sys.exit(1)

    y = df[TARGET_COLUMN].values

    # Separate meta columns (keep for stratification, not for training)
    meta_cols_present = [c for c in META_COLUMNS if c in df.columns]
    meta_df = df[meta_cols_present].copy()

    # Feature columns = everything except meta + target
    feature_cols = [c for c in df.columns if c not in META_COLUMNS and c != TARGET_COLUMN]
    X = df[feature_cols].copy()

    # Label-encode any remaining string/object columns
    encoders = {}
    encoded_count = 0
    for col in X.columns:
        if X[col].dtype == object:
            le = LabelEncoder()
            # Handle empty strings and NaN
            X[col] = X[col].fillna("__missing__").astype(str).str.strip('"')
            X[col] = le.fit_transform(X[col])
            encoders[col] = list(le.classes_)
            encoded_count += 1

    # Fill any remaining NaN with 0 (defensive — extraction should have imputed)
    nan_count = X.isna().sum().sum()
    if nan_count > 0:
        print(f"  Warning: {nan_count} NaN values found, filling with 0")
        X = X.fillna(0)

    print(f"  Features: {len(feature_cols)} | Label-encoded: {encoded_count} | Target: {TARGET_COLUMN}")
    return X, y, meta_df, encoders, list(feature_cols)


def split_data(X: pd.DataFrame, y: np.ndarray, meta_df: pd.DataFrame) -> tuple:
    """
    Stratified 85/15 train/test split.
    Stratify by vertical if possible, fall back to health_level.
    """
    # Choose stratification variable
    strat_col = None
    for col in ["vertical", "health_level"]:
        if col in meta_df.columns:
            counts = meta_df[col].value_counts()
            if counts.min() >= 2:  # need at least 2 per class for stratified split
                strat_col = col
                break

    strat_values = meta_df[strat_col].values if strat_col else None
    strat_label = strat_col or "none"

    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, np.arange(len(y)),
        test_size=TEST_SIZE,
        random_state=SEED,
        stratify=strat_values,
    )

    print(f"  Train: {len(X_train)} | Test: {len(X_test)} | Stratified by: {strat_label}")

    split_info = {
        "seed": SEED,
        "test_size": TEST_SIZE,
        "stratify_by": strat_label,
        "train_indices": idx_train.tolist(),
        "test_indices": idx_test.tolist(),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }

    return X_train, X_test, y_train, y_test, split_info


def tune_hyperparams(X_train: pd.DataFrame, y_train: np.ndarray) -> tuple:
    """
    GridSearchCV with RepeatedKFold (5-fold x 3 repeats) over the param grid.
    Returns (best_params, cv_results_summary).
    """
    cv = RepeatedKFold(n_splits=5, n_repeats=3, random_state=SEED)

    base_model = xgb.XGBRegressor(**FIXED_PARAMS)

    grid_search = GridSearchCV(
        estimator=base_model,
        param_grid=PARAM_GRID,
        cv=cv,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
        verbose=0,
    )

    n_combos = 1
    for v in PARAM_GRID.values():
        n_combos *= len(v)
    n_folds = 5 * 3
    print(f"  Grid: {n_combos} combos x {n_folds} folds = {n_combos * n_folds} fits")

    start = time.time()
    grid_search.fit(X_train, y_train)
    elapsed = time.time() - start

    best_mae = -grid_search.best_score_
    best_std = grid_search.cv_results_["std_test_score"][grid_search.best_index_]

    print(f"  Best CV MAE: {best_mae:.2f} +/- {abs(best_std):.2f} ({elapsed:.1f}s)")

    cv_summary = {
        "best_cv_mae": round(float(best_mae), 4),
        "best_cv_std": round(float(abs(best_std)), 4),
        "n_combinations": n_combos,
        "n_folds": n_folds,
        "tuning_seconds": round(elapsed, 1),
    }

    return grid_search.best_params_, cv_summary


def train_final(
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    best_params: dict,
) -> xgb.XGBRegressor:
    """Train the final model on the full training set with best params."""
    all_params = {**FIXED_PARAMS, **best_params}
    model = xgb.XGBRegressor(**all_params)
    model.fit(X_train, y_train)
    print(f"  Trained with: depth={best_params['max_depth']}, "
          f"lr={best_params['learning_rate']}, "
          f"trees={best_params['n_estimators']}, "
          f"alpha={best_params['reg_alpha']}, "
          f"lambda={best_params['reg_lambda']}")
    return model


def score_to_tier(score: float) -> str:
    """Map a foundation score to its tier label."""
    for low, high, label in TIER_BOUNDARIES:
        if low <= score <= high:
            return label
    return "Unknown"


def evaluate(
    model: xgb.XGBRegressor,
    X_test: pd.DataFrame,
    y_test: np.ndarray,
) -> dict:
    """Evaluate on the held-out test set. Clip predictions to [0, 100]."""
    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0, 100)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    max_err = float(np.max(np.abs(y_test - y_pred)))

    # Per-tier accuracy
    actual_tiers = [score_to_tier(s) for s in y_test]
    pred_tiers = [score_to_tier(s) for s in y_pred]
    tier_correct = sum(a == p for a, p in zip(actual_tiers, pred_tiers))
    tier_accuracy = tier_correct / len(y_test) if len(y_test) > 0 else 0

    # Residual stats
    residuals = y_test - y_pred
    out_of_bounds = int(np.sum((y_pred < 0) | (y_pred > 100)))

    metrics = {
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2": round(float(r2), 4),
        "max_absolute_error": round(max_err, 4),
        "tier_accuracy": round(float(tier_accuracy), 4),
        "tier_correct": tier_correct,
        "tier_total": len(y_test),
        "residual_mean": round(float(np.mean(residuals)), 4),
        "residual_std": round(float(np.std(residuals)), 4),
        "out_of_bounds_predictions": out_of_bounds,
    }

    return metrics


def get_feature_importance(
    model: xgb.XGBRegressor,
    feature_names: list,
    top_n: int = 20,
) -> list:
    """Extract top N features by gain importance."""
    importances = model.get_booster().get_score(importance_type="gain")

    # When trained with a DataFrame, XGBoost stores importances by column name
    importance_list = []
    for name in feature_names:
        gain = importances.get(name, 0.0)
        importance_list.append({
            "feature": name,
            "gain": round(float(gain), 4),
            "is_critical": name in CRITICAL_FEATURES,
        })

    importance_list.sort(key=lambda x: x["gain"], reverse=True)
    return importance_list[:top_n]


def save_artifacts(
    model: xgb.XGBRegressor,
    split_info: dict,
    best_params: dict,
    cv_summary: dict,
    test_metrics: dict,
    encoders: dict,
    feature_names: list,
    top_features: list,
) -> None:
    """Save model, metadata, and split indices."""
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(SPLITS_DIR, exist_ok=True)

    # Model
    model_path = os.path.join(MODEL_DIR, "foundation_score_v1.json")
    model.save_model(model_path)
    print(f"  Model:    {model_path}")

    # Metadata
    metadata = {
        "model_version": "v1",
        "target": TARGET_COLUMN,
        "n_features": len(feature_names),
        "feature_names": feature_names,
        "best_params": best_params,
        "fixed_params": {k: v for k, v in FIXED_PARAMS.items() if k != "verbosity"},
        "cv_summary": cv_summary,
        "test_metrics": test_metrics,
        "label_encoders": encoders,
        "top_features": top_features,
        "meta_columns_excluded": META_COLUMNS,
        "seed": SEED,
    }
    meta_path = os.path.join(MODEL_DIR, "foundation_score_v1_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Metadata: {meta_path}")

    # Split indices
    split_path = os.path.join(SPLITS_DIR, "split_v1.json")
    with open(split_path, "w") as f:
        json.dump(split_info, f, indent=2)
    print(f"  Splits:   {split_path}")


# ─── Main ─────────────────────────────────────────────────────────────────────


def main():
    separator = "=" * 55

    print(separator)
    print("AURAFLOW FOUNDATION SCORE MODEL — TRAINING")
    print(separator)

    # 1. Load
    print("\n[1/6] Loading data...")
    df = load_data(CSV_PATH)

    # 2. Preprocess
    print("\n[2/6] Preprocessing...")
    X, y, meta_df, encoders, feature_names = preprocess(df)

    # 3. Split
    print("\n[3/6] Splitting train/test...")
    X_train, X_test, y_train, y_test, split_info = split_data(X, y, meta_df)

    # 4. Tune
    print("\n[4/6] Tuning hyperparameters...")
    best_params, cv_summary = tune_hyperparams(X_train, y_train)

    # 5. Train final
    print("\n[5/6] Training final model...")
    model = train_final(X_train, y_train, best_params)

    # 6. Evaluate
    print("\n[6/6] Evaluating on test set...")
    test_metrics = evaluate(model, X_test, y_test)

    # Feature importance
    top_features = get_feature_importance(model, feature_names, top_n=20)

    # Save
    print("\nSaving artifacts...")
    save_artifacts(
        model, split_info, best_params, cv_summary,
        test_metrics, encoders, feature_names, top_features,
    )

    # ─── Report ───────────────────────────────────────────────────────────

    print(f"\n{separator}")
    print("TRAINING REPORT")
    print(separator)

    print(f"  Dataset:          {len(df)} samples, {len(feature_names)} features")
    print(f"  Train/Test:       {split_info['train_size']} / {split_info['test_size']}"
          f" (stratified by {split_info['stratify_by']})")
    if encoders:
        print(f"  Label-encoded:    {len(encoders)} categorical columns")

    print(f"\n  HYPERPARAMETER TUNING ({cv_summary['n_combinations']} combos, "
          f"5-fold x 3 repeats)")
    print(f"    Best CV MAE:    {cv_summary['best_cv_mae']:.2f} "
          f"+/- {cv_summary['best_cv_std']:.2f}")
    print(f"    Time:           {cv_summary['tuning_seconds']}s")

    print(f"\n  TEST SET PERFORMANCE")
    print(f"    MAE:            {test_metrics['mae']:.2f} points")
    print(f"    RMSE:           {test_metrics['rmse']:.2f} points")
    print(f"    R-squared:      {test_metrics['r2']:.3f}")
    print(f"    Max Error:      {test_metrics['max_absolute_error']:.2f} points")
    print(f"    Tier Accuracy:  {test_metrics['tier_correct']}/{test_metrics['tier_total']}"
          f" ({test_metrics['tier_accuracy']:.0%})")

    print(f"\n  TOP 20 FEATURES (by gain)")
    for i, feat in enumerate(top_features, 1):
        tag = " [CRITICAL]" if feat["is_critical"] else ""
        print(f"    {i:>2}. {feat['feature']:<45} {feat['gain']:>8.1f}{tag}")

    print(f"\n{separator}")
    print("Done.")
    print(separator)


if __name__ == "__main__":
    main()
