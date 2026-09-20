"""
Predictive Analytics Engine for Asset Failure & Service Disruption Risk
Trained on synthetic historical failure logs reflecting Indian Railways operations.
Estimates:
1. Baseline Asset Failure Probability
2. Probability of Service Disruption (P_disruption) if maintenance block is deferred (24h, 48h, 7d)
3. Projected Train Delay Impact Minutes
"""

import numpy as np
import os
import pickle
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, Any, Optional

MODEL_FILE = os.path.join(os.path.dirname(__file__), "failure_model.pkl")
DISRUPTION_MODEL_FILE = os.path.join(os.path.dirname(__file__), "disruption_model.pkl")

class AssetFailurePredictor:
    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self._load_or_train()

    def _generate_synthetic_training_data(self, n_samples: int = 1500):
        np.random.seed(42)
        age = np.random.uniform(0.5, 30.0, n_samples)
        days_since_maint = np.random.uniform(5, 365, n_samples)
        past_defects = np.random.poisson(lam=3.0, size=n_samples)
        traffic_level = np.random.randint(1, 6, n_samples)
        load_ratio = np.random.uniform(0.3, 1.0, n_samples)
        env_stress = np.random.uniform(1.0, 10.0, n_samples)

        X = np.column_stack([
            age, days_since_maint, past_defects, traffic_level, load_ratio, env_stress
        ])

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
        failure_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        return round(float(np.clip(failure_prob, 0.02, 0.98)), 3)


class DisruptionRiskPredictor:
    """
    Random Forest model trained to estimate probability of service disruption
    if an engineering block window is deferred.
    Features:
    - defect_severity (1-10)
    - cci_score (1-100)
    - gmt_density (10-85)
    - days_overdue (0-30)
    - deferral_hours (12, 24, 48, 168)
    - trains_per_hour (2-12)
    """
    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self._load_or_train()

    def _generate_synthetic_historical_disruptions(self, n_samples: int = 2000):
        np.random.seed(101)
        severity = np.random.uniform(1, 10, n_samples)
        cci = np.random.uniform(10, 100, n_samples)
        gmt = np.random.uniform(10, 85, n_samples)
        overdue = np.random.uniform(0, 20, n_samples)
        deferral_hrs = np.random.choice([12, 24, 48, 72, 168], size=n_samples)
        trains_hr = np.random.uniform(2, 10, n_samples)

        X = np.column_stack([severity, cci, gmt, overdue, deferral_hrs, trains_hr])

        # Underlying disruption equation modeling railway cascade effects
        risk_score = (
            0.25 * severity +
            0.02 * cci +
            0.015 * gmt +
            0.08 * overdue +
            0.008 * deferral_hrs +
            0.12 * trains_hr -
            4.0
        )
        p = 1.0 / (1.0 + np.exp(-risk_score))
        y = (np.random.rand(n_samples) < p).astype(int)

        return X, y

    def _load_or_train(self):
        if os.path.exists(DISRUPTION_MODEL_FILE):
            try:
                with open(DISRUPTION_MODEL_FILE, "rb") as f:
                    self.model = pickle.load(f)
                    return
            except Exception:
                pass

        X, y = self._generate_synthetic_historical_disruptions()
        self.model = RandomForestClassifier(n_estimators=80, max_depth=7, random_state=101)
        self.model.fit(X, y)
        try:
            with open(DISRUPTION_MODEL_FILE, "wb") as f:
                pickle.dump(self.model, f)
        except Exception:
            pass

    def predict_disruption(
        self,
        severity: int = 7,
        cci_score: int = 65,
        gmt_density: float = 65.0,
        days_overdue: int = 1,
        trains_per_hour: float = 6.0
    ) -> Dict[str, Any]:
        """
        Calculates disruption probability across 3 deferral horizons: 24h, 48h, 7 days.
        """
        if self.model is None:
            self._load_or_train()

        horizons = [24, 48, 168]
        horizon_results = {}

        for h in horizons:
            X_in = np.array([[severity, cci_score, gmt_density, days_overdue, h, trains_per_hour]])
            probs = self.model.predict_proba(X_in)[0]
            p_disrupt = float(probs[1]) if len(probs) > 1 else float(probs[0])
            p_disrupt = round(float(np.clip(p_disrupt, 0.05, 0.96)), 3)

            # Estimated delay minutes if disruption occurs
            expected_delay_min = int(round(p_disrupt * (gmt_density / 10.0) * (trains_per_hour * 12.0)))

            if p_disrupt >= 0.70:
                risk_level = "CRITICAL_HAZARD"
            elif p_disrupt >= 0.45:
                risk_level = "ELEVATED_RISK"
            elif p_disrupt >= 0.25:
                risk_level = "MODERATE_RISK"
            else:
                risk_level = "ACCEPTABLE_BUFFER"

            horizon_results[f"defer_{h}h"] = {
                "deferral_hours": h,
                "disruption_probability": p_disrupt,
                "risk_level": risk_level,
                "expected_train_delay_minutes": expected_delay_min
            }

        return {
            "severity": severity,
            "cci_score": cci_score,
            "gmt_density": gmt_density,
            "days_overdue": days_overdue,
            "trains_per_hour": trains_per_hour,
            "deferral_scenarios": horizon_results,
            "recommendation": "EXECUTE_IMMEDIATE_BLOCK" if horizon_results["defer_24h"]["disruption_probability"] >= 0.65 else "DEFERRAL_FEASIBLE_UP_TO_48H"
        }

predictor = AssetFailurePredictor()
disruption_predictor = DisruptionRiskPredictor()

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

def predict_disruption_risk(
    severity: int = 7,
    cci_score: int = 65,
    gmt_density: float = 65.0,
    days_overdue: int = 1,
    trains_per_hour: float = 6.0
) -> Dict[str, Any]:
    return disruption_predictor.predict_disruption(
        severity=severity,
        cci_score=cci_score,
        gmt_density=gmt_density,
        days_overdue=days_overdue,
        trains_per_hour=trains_per_hour
    )
