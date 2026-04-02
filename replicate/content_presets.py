"""
Content type presets that adjust metric weights for different video types.

Each preset defines multipliers for the 7 core metrics. The neural score
is recomputed using these weighted values, giving content-type-specific
scoring that reflects what matters most for that format.
"""

PRESETS = {
    "short-form": {
        "label": "Short-Form (TikTok, Reels, Shorts)",
        "description": "Hook strength, attention retention, and emotional peaks matter most",
        "weights": {
            "emotionalResonance": 1.3,
            "attentionFocus": 1.4,
            "memorability": 1.0,
            "narrativeComprehension": 0.7,
            "faceImpact": 1.2,
            "sceneImpact": 0.9,
            "motionEnergy": 1.1,
        },
        "suggestion_context": "short-form video (under 60s)",
    },
    "ad": {
        "label": "Advertisement / Commercial",
        "description": "Brand recall, emotional response, and memorability are critical",
        "weights": {
            "emotionalResonance": 1.4,
            "attentionFocus": 1.1,
            "memorability": 1.5,
            "narrativeComprehension": 1.0,
            "faceImpact": 1.2,
            "sceneImpact": 1.0,
            "motionEnergy": 0.8,
        },
        "suggestion_context": "advertisement or commercial",
    },
    "youtube": {
        "label": "YouTube Long-Form",
        "description": "Sustained attention, narrative arc, and comprehension matter most",
        "weights": {
            "emotionalResonance": 1.0,
            "attentionFocus": 1.3,
            "memorability": 1.0,
            "narrativeComprehension": 1.4,
            "faceImpact": 1.0,
            "sceneImpact": 1.1,
            "motionEnergy": 0.8,
        },
        "suggestion_context": "YouTube long-form video",
    },
    "podcast-clip": {
        "label": "Podcast Clip",
        "description": "Comprehension and emotional resonance dominate, visuals are secondary",
        "weights": {
            "emotionalResonance": 1.3,
            "attentionFocus": 1.1,
            "memorability": 1.0,
            "narrativeComprehension": 1.5,
            "faceImpact": 0.8,
            "sceneImpact": 0.5,
            "motionEnergy": 0.4,
        },
        "suggestion_context": "podcast clip",
    },
    "custom": {
        "label": "Custom (No Adjustment)",
        "description": "Raw neural scores without content-type weighting",
        "weights": {
            "emotionalResonance": 1.0,
            "attentionFocus": 1.0,
            "memorability": 1.0,
            "narrativeComprehension": 1.0,
            "faceImpact": 1.0,
            "sceneImpact": 1.0,
            "motionEnergy": 1.0,
        },
        "suggestion_context": "video content",
    },
}


def apply_preset(metrics_result, content_type="custom"):
    """
    Apply content type weights to an existing metrics result.

    Adjusts the per-metric scores and recomputes the neural composite score
    using weighted averages. Does not modify timeline data — only summary scores.

    Args:
        metrics_result: dict from compute_metrics()
        content_type: one of the PRESETS keys

    Returns:
        Modified metrics_result with adjusted scores and content_type metadata
    """
    preset = PRESETS.get(content_type, PRESETS["custom"])
    weights = preset["weights"]

    # Adjust individual metric scores
    if "metrics" in metrics_result:
        adjusted_metrics = {}
        for metric, value in metrics_result["metrics"].items():
            w = weights.get(metric, 1.0)
            # Clamp to 0.0-1.0 after weighting
            adjusted_metrics[metric] = min(1.0, max(0.0, value * w))
        metrics_result["metrics"] = adjusted_metrics

    # Recompute neural score with content-type weights
    if "metrics" in metrics_result:
        m = metrics_result["metrics"]
        # Weighted score using same formula as _compute_neural_score
        # but with preset multipliers baked into the metric values
        score_weights = {
            "emotionalResonance": 0.30,
            "attentionFocus": 0.25,
            "memorability": 0.20,
            "narrativeComprehension": 0.15,
            "sceneImpact": 0.05,
            "motionEnergy": 0.05,
        }
        raw = sum(m.get(k, 0) * w for k, w in score_weights.items())
        metrics_result["neuralScore"] = max(0, min(100, int(round(raw * 100))))

    # Add content type metadata
    metrics_result["contentType"] = content_type
    metrics_result["contentTypeLabel"] = preset["label"]
    metrics_result["schemaVersion"] = 2

    return metrics_result


def list_presets():
    """Return list of available presets with metadata."""
    return [
        {"value": key, "label": p["label"], "description": p["description"]}
        for key, p in PRESETS.items()
    ]
