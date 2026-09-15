import numpy as np
import os
import pickle
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, Any, Optional

MODEL_FILE = os.path.join(os.path.dirname(__file__), "failure_model.pkl")

class AssetFailurePredictor:
    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self._load_or_train()

    def _generate_synthetic_training_data(self, n_samples: int = 1500):
        np.random.seed(42)
        # Features:
        # 1. age_years (0.5 to 30)
        # 2. days_since_last_maintenance (5 to 365)
        # 3. past_defect_count (0 to 15)
        # 4. corridor_traffic_level (1 to 5)
        # 5. operational_load_ratio (0.3 to 1.0)
        # 6. environmental_stress (1 to 10)
        age = np.random.uniform(0.5, 30.0, n_samples)
        days_since_maint = np.random.uniform(5, 365, n_samples)
        past_defects = np.random.poisson(lam=3.0, size=n_samples)
        traffic_level = np.random.randint(1, 6, n_samples)
        load_ratio = np.random.uniform(0.3, 1.0, n_samples)
        env_stress = np.random.uniform(1.0, 10.0, n_samples)

        X = np.column_stack([
            age, days_since_maint, past_defects, traffic_level, load_ratio, env_stress
        ])

        # Underlying synthetic logistic risk factor
        z = (
            0.05 * age +
            0.008 * days_since_maint +
            0.18 * past_defects +
            0.25 * traffic_level +
            1.2 * load_ratio +
            0.15 * env_stress -
            4.2
        )
        prob = 1.0 / (1.0 + np.exp(-z))
        y = (np.random.rand(n_samples) < prob).astype(int)

        return X, y

    def _load_or_train(self):
        if os.path.exists(MODEL_FILE):
            try:
                with open(MODEL_FILE, "rb") as f:
                    self.model = pickle.load(f)
                    return
            except Exception:
                pass

        # Train a new RandomForest model on synthetic data
        X, y = self._generate_synthetic_training_data()
        self.model = RandomForestClassifier(n_estimators=60, max_depth=6, random_state=42)
        self.model.fit(X, y)
        try:
            with open(MODEL_FILE, "wb") as f:
                pickle.dump(self.model, f)
        except Exception:
            pass

    def predict_failure_probability(
        self,
        age_years: float = 5.0,
        days_since_last_maintenance: int = 45,
        past_defect_count: int = 2,
        corridor_traffic_level: int = 3,
        operational_load_ratio: float = 0.7,
        environmental_stress: float = 4.0
    ) -> float:
        """
        Calculates calibrated failure probability (0.01 - 0.99) for an asset.
        """
        if self.model is None:
            self._load_or_train()

        X_input = np.array([[
            age_years,
            days_since_last_maintenance,
            past_defect_count,
            corridor_traffic_level,
            operational_load_ratio,
            environmental_stress
        ]])

        probs = self.model.predict_proba(X_input)[0]
        # Probability of class 1 (failure)
        failure_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        return round(float(np.clip(failure_prob, 0.02, 0.98)), 3)

predictor = AssetFailurePredictor()

def predict_asset_failure(
    age_years: float = 5.0,
    days_since_maint: int = 45,
    past_defects: int = 2,
    traffic_level: int = 3,
    load_ratio: float = 0.7,
    env_stress: float = 4.0
) -> float:
    return predictor.predict_failure_probability(
        age_years=age_years,
        days_since_last_maintenance=days_since_maint,
        past_defect_count=past_defects,
        corridor_traffic_level=traffic_level,
        operational_load_ratio=load_ratio,
        environmental_stress=env_stress
    )
