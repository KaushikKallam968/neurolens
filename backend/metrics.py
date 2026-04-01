"""
Translate brain region activations into marketing-actionable metrics.

Takes TribeV2 predictions (n_timesteps, n_vertices) and produces a structured
report with per-second timelines, peak moments, neural composite score, and
actionable suggestions for content improvement.
"""

import numpy as np
from .brain_regions import get_roi_activation, get_category_activation


def _sigmoid_normalize(values, center=None, scale=None):
    """
    Normalize raw activations to 0.0-1.0 using a sigmoid function.

    Automatically centers on the mean and scales by the standard deviation
    if no explicit center/scale are provided.
    """
    arr = np.array(values, dtype=np.float64)

    if center is None:
        center = np.mean(arr)
    if scale is None:
        scale = np.std(arr) if np.std(arr) > 1e-8 else 1.0

    z = (arr - center) / scale
    return 1.0 / (1.0 + np.exp(-z))


def _safe_list(arr):
    """Convert numpy array to a list of rounded Python floats."""
    return [round(float(v), 3) for v in arr]


def _compute_timeline(predictions):
    """
    Build per-second metric timelines from vertex predictions.

    Args:
        predictions: numpy array (n_timesteps, n_vertices)

    Returns:
        dict of metric_name -> list of float values (one per timestep)
    """
    # Emotional resonance: amygdala + insula + vmPFC + TPJ
    emotional_raw = get_category_activation(predictions, "emotional")
    emotional = _sigmoid_normalize(emotional_raw)

    # Attention focus: dlPFC + V1/V2 + FEF
    attention_raw = get_category_activation(predictions, "attention")
    attention = _sigmoid_normalize(attention_raw)

    # Memorability: hippocampus + parahippocampal
    memory_raw = get_category_activation(predictions, "memory")
    memorability = _sigmoid_normalize(memory_raw)

    # Narrative comprehension: Broca + Wernicke + left temporal
    language_raw = get_category_activation(predictions, "language")
    comprehension = _sigmoid_normalize(language_raw)

    # Face impact: FFA activation (people, faces, celebrities)
    ffa_raw = get_roi_activation(predictions, "ffa")
    face_impact = _sigmoid_normalize(ffa_raw)

    # Scene impact: PPA + EBA (environments, body language)
    ppa_raw = get_roi_activation(predictions, "ppa")
    eba_raw = get_roi_activation(predictions, "eba")
    scene_raw = (np.array(ppa_raw) + np.array(eba_raw)) / 2.0
    scene_impact = _sigmoid_normalize(scene_raw)

    # Motion energy: MT+ (visual motion area)
    mt_raw = get_roi_activation(predictions, "mt_plus")
    motion_energy = _sigmoid_normalize(mt_raw)

    return {
        "emotionalResonance": _safe_list(emotional),
        "attentionFocus": _safe_list(attention),
        "memorability": _safe_list(memorability),
        "narrativeComprehension": _safe_list(comprehension),
        "faceImpact": _safe_list(face_impact),
        "sceneImpact": _safe_list(scene_impact),
        "motionEnergy": _safe_list(motion_energy),
    }


def _detect_peaks(timeline, threshold=0.8):
    """
    Find timesteps where any metric crosses the threshold.

    Returns:
        list of {"time": float, "metric": str, "value": float, "label": str}
    """
    metric_labels = {
        "emotionalResonance": "Emotional spike",
        "attentionFocus": "Attention peak",
        "memorability": "Memory encoding peak",
        "narrativeComprehension": "Narrative engagement peak",
        "faceImpact": "Strong face response",
        "sceneImpact": "Scene recognition peak",
        "motionEnergy": "High motion engagement",
    }

    peaks = []
    for metric_name, values in timeline.items():
        for i, val in enumerate(values):
            if val >= threshold:
                peaks.append({
                    "time": round(float(i), 1),
                    "metric": metric_name,
                    "value": round(val, 3),
                    "label": metric_labels.get(metric_name, "Peak detected"),
                })

    # Sort by time, then by value descending
    peaks.sort(key=lambda p: (p["time"], -p["value"]))

    # Deduplicate: keep only the highest peak per second
    seen_times = {}
    deduped = []
    for peak in peaks:
        t = peak["time"]
        if t not in seen_times or peak["value"] > seen_times[t]["value"]:
            seen_times[t] = peak

    deduped = sorted(seen_times.values(), key=lambda p: p["time"])
    return deduped


def _generate_suggestions(timeline):
    """
    Analyze timelines for drops and anomalies, generate actionable suggestions.

    Returns:
        list of {"time": float, "type": str, "message": str}
    """
    suggestions = []
    attention = timeline["attentionFocus"]
    emotion = timeline["emotionalResonance"]
    memory = timeline["memorability"]

    n = len(attention)

    for i in range(1, n):
        # Attention drop: significant decrease from previous second
        if i > 0 and attention[i] < 0.35 and attention[i - 1] > 0.55:
            suggestions.append({
                "time": round(float(i), 1),
                "type": "attentionDrop",
                "message": "Attention drops here — consider a visual cut or text overlay",
            })

        # Emotional flatline: low emotion for 3+ consecutive seconds
        if i >= 2 and all(emotion[j] < 0.35 for j in range(i - 2, i + 1)):
            # Only flag once per flatline stretch
            if i == 2 or emotion[i - 3] >= 0.35:
                suggestions.append({
                    "time": round(float(i - 1), 1),
                    "type": "emotionalFlatline",
                    "message": "Emotional engagement is flat — try adding music, a face, or a story beat",
                })

        # Memory dip: low memorability in the first 3 seconds (bad for hook)
        if i <= 3 and memory[i] < 0.3:
            if not any(s["type"] == "weakHook" for s in suggestions):
                suggestions.append({
                    "time": 0.0,
                    "type": "weakHook",
                    "message": "Opening isn't memorable — lead with a surprising visual or bold statement",
                })

    # Ending check: low attention in the last 2 seconds
    if n >= 2 and all(attention[j] < 0.4 for j in range(n - 2, n)):
        suggestions.append({
            "time": round(float(n - 2), 1),
            "type": "weakEnding",
            "message": "Attention fades at the end — add a strong CTA or closing hook",
        })

    # Sort by time
    suggestions.sort(key=lambda s: s["time"])
    return suggestions


def _compute_neural_score(timeline):
    """
    Compute the 0-100 composite neural score.

    Formula: emotion*0.30 + attention*0.25 + memorability*0.20
             + comprehension*0.15 + visual_impact*0.10

    Visual impact = max(faceImpact, sceneImpact, motionEnergy) per timestep.
    """
    emotion_mean = np.mean(timeline["emotionalResonance"])
    attention_mean = np.mean(timeline["attentionFocus"])
    memory_mean = np.mean(timeline["memorability"])
    comprehension_mean = np.mean(timeline["narrativeComprehension"])

    face = np.array(timeline["faceImpact"])
    scene = np.array(timeline["sceneImpact"])
    motion = np.array(timeline["motionEnergy"])
    visual_mean = float(np.mean(np.maximum(np.maximum(face, scene), motion)))

    raw_score = (
        emotion_mean * 0.30
        + attention_mean * 0.25
        + memory_mean * 0.20
        + comprehension_mean * 0.15
        + visual_mean * 0.10
    )

    # Scale to 0-100 (raw_score is 0.0-1.0 range)
    return int(round(raw_score * 100))


def compute_metrics(predictions, segments=None):
    """
    Full analysis pipeline: predictions -> marketing metrics.

    Args:
        predictions: numpy array (n_timesteps, n_vertices)
        segments: optional segment metadata from TribeV2 (unused for now, reserved)

    Returns:
        dict with neuralScore, timeline, peaks, and suggestions
    """
    try:
        preds = np.array(predictions, dtype=np.float64)

        # Handle 1D predictions (single timepoint) by adding a time axis
        if preds.ndim == 1:
            preds = preds.reshape(1, -1)

        timeline = _compute_timeline(preds)
        peaks = _detect_peaks(timeline)
        suggestions = _generate_suggestions(timeline)
        neural_score = _compute_neural_score(timeline)

        metrics_summary = {
            key: round(float(np.mean(values)), 3)
            for key, values in timeline.items()
        }

        return {
            "neuralScore": neural_score,
            "metrics": metrics_summary,
            "timeline": timeline,
            "peaks": peaks,
            "suggestions": suggestions,
        }
    except Exception as e:
        return {
            "neuralScore": 0,
            "timeline": {},
            "peaks": [],
            "suggestions": [],
            "error": f"Metrics computation failed: {str(e)}",
        }
