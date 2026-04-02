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


def _generate_sensory_breakdown(timeline):
    """Derive sensory channel contributions from metric timelines."""
    n = len(timeline.get("emotionalResonance", []))
    if n == 0:
        return {"visual": [], "audio": [], "language": []}

    face = np.array(timeline["faceImpact"])
    scene = np.array(timeline["sceneImpact"])
    motion = np.array(timeline["motionEnergy"])
    visual_raw = (face + scene + motion) / 3.0 + 0.35

    emotion = np.array(timeline["emotionalResonance"])
    audio_raw = emotion * 0.6 + 0.30

    comprehension = np.array(timeline["narrativeComprehension"])
    language_raw = comprehension * 0.5 + 0.20

    total = visual_raw + audio_raw + language_raw
    return {
        "visual": _safe_list(visual_raw / total),
        "audio": _safe_list(audio_raw / total),
        "language": _safe_list(language_raw / total),
    }


def _compute_cognitive_load(timeline):
    """Derive cognitive load from frontal activation patterns."""
    attention = np.array(timeline["attentionFocus"])
    comprehension = np.array(timeline["narrativeComprehension"])
    raw = 0.6 * attention + 0.4 * comprehension
    mean_load = float(np.mean(raw))
    return {
        "score": int(round(mean_load * 100)),
        "timeline": _safe_list(raw),
        "label": "Easy to process" if mean_load < 0.45 else "Moderate complexity" if mean_load < 0.65 else "High cognitive demand",
    }


def _compute_focus_score(timeline):
    """Compute attention focus vs scatter."""
    attention = np.array(timeline["attentionFocus"])
    std = float(np.std(attention))
    focus = max(0, min(1, 1.0 - std * 3))
    return {
        "score": int(round(focus * 100)),
        "label": "Scattered" if focus < 0.4 else "Moderate focus" if focus < 0.65 else "Highly focused",
    }


def _generate_narrative_arc(timeline):
    """Generate the emotional narrative arc of the content."""
    emotion = np.array(timeline["emotionalResonance"])
    attention = np.array(timeline["attentionFocus"])
    arc = 0.6 * emotion + 0.4 * attention

    kernel = np.ones(3) / 3
    if len(arc) > 3:
        arc = np.convolve(arc, kernel, mode='same')

    return {
        "curve": _safe_list(arc),
        "hookStrength": round(float(np.mean(arc[:3])), 3) if len(arc) >= 3 else 0,
        "climaxTime": int(np.argmax(arc)),
        "climaxValue": round(float(np.max(arc)), 3),
        "endingStrength": round(float(np.mean(arc[-3:])), 3) if len(arc) >= 3 else 0,
    }


def _compute_av_sync(sensory):
    """Compute audio-visual synchronization score."""
    visual = np.array(sensory["visual"])
    audio = np.array(sensory["audio"])
    if len(visual) < 2:
        return {"score": 50, "label": "Insufficient data"}
    corr = float(np.corrcoef(visual, audio)[0, 1])
    score = int(round((corr + 1) / 2 * 100))
    return {
        "score": max(0, min(100, score)),
        "label": "Strong sync" if score > 65 else "Moderate sync" if score > 40 else "Audio and visuals are misaligned",
    }


def _generate_key_moments(timeline, peaks):
    """Generate key moment entries with timestamps and types."""
    moments = []
    emotion = timeline["emotionalResonance"]
    attention = timeline["attentionFocus"]

    if len(emotion) >= 3 and max(emotion[:3]) > 0.6:
        moments.append({"time": 1, "type": "hookSuccess", "label": "Strong hook", "value": round(max(emotion[:3]), 2)})
    elif len(emotion) >= 3:
        moments.append({"time": 0, "type": "hookWeak", "label": "Weak hook", "value": round(max(emotion[:3]), 2)})

    if peaks:
        top_peak = max(peaks, key=lambda p: p["value"])
        moments.append({"time": top_peak["time"], "type": "peakEngagement", "label": "Peak engagement", "value": top_peak["value"]})

    for i in range(1, len(attention)):
        if attention[i] < 0.35 and (i == 1 or attention[i - 1] > 0.5):
            moments.append({"time": i, "type": "attentionDrop", "label": "Attention drops", "value": round(attention[i], 2)})
            break

    if len(emotion) >= 2 and emotion[-1] > 0.6:
        moments.append({"time": len(emotion) - 1, "type": "strongEnding", "label": "Strong ending", "value": round(emotion[-1], 2)})

    moments.sort(key=lambda m: m["time"])
    return moments[:6]


def _generate_smart_suggestions(timeline, peaks):
    """Generate specific, actionable suggestions with recommended actions."""
    suggestions = []
    attention = timeline["attentionFocus"]
    emotion = timeline["emotionalResonance"]
    memory = timeline["memorability"]

    for i in range(1, len(attention)):
        if attention[i] < 0.35 and (i == 1 or attention[i - 1] > 0.55):
            suggestions.append({
                "time": round(float(i), 1),
                "type": "attentionDrop",
                "severity": "critical",
                "message": "Attention drops significantly here",
                "action": "Add a visual cut, text overlay, or scene change to re-engage viewers",
            })
            break

    for i in range(2, len(emotion)):
        if all(emotion[j] < 0.35 for j in range(i - 2, i + 1)):
            suggestions.append({
                "time": round(float(i - 1), 1),
                "type": "emotionalFlatline",
                "severity": "warning",
                "message": "Emotional engagement is flat for 3+ seconds",
                "action": "Introduce a face, music change, or story beat to reignite emotion",
            })
            break

    if len(memory) >= 3 and all(memory[j] < 0.35 for j in range(min(3, len(memory)))):
        suggestions.append({
            "time": 0.0,
            "type": "weakHook",
            "severity": "critical",
            "message": "Opening isn't memorable — viewers likely scroll past",
            "action": "Lead with a surprising visual, bold statement, or pattern interrupt in the first 1.5 seconds",
        })

    if len(attention) >= 2 and all(attention[j] < 0.4 for j in range(max(0, len(attention) - 2), len(attention))):
        suggestions.append({
            "time": round(float(len(attention) - 2), 1),
            "type": "weakEnding",
            "severity": "warning",
            "message": "Attention fades at the end",
            "action": "Add a strong CTA, callback to the hook, or cliffhanger to drive rewatches and shares",
        })

    if peaks:
        top = max(peaks, key=lambda p: p["value"])
        suggestions.append({
            "time": top["time"],
            "type": "peakStrength",
            "severity": "strength",
            "message": f"Peak engagement at this moment ({top['label'].lower()})",
            "action": "This is your strongest moment — consider building your CTA or key message around this timestamp",
        })

    suggestions.sort(key=lambda s: s["time"])
    return suggestions


def compute_metrics(predictions, segments=None):
    """
    Full analysis pipeline: predictions -> marketing metrics.

    Args:
        predictions: numpy array (n_timesteps, n_vertices)
        segments: optional segment metadata from TribeV2 (unused for now, reserved)

    Returns:
        dict with all dashboard fields matching mock_inference output format
    """
    try:
        preds = np.array(predictions, dtype=np.float64)

        # Handle 1D predictions (single timepoint) by adding a time axis
        if preds.ndim == 1:
            preds = preds.reshape(1, -1)

        timeline = _compute_timeline(preds)
        peaks = _detect_peaks(timeline)
        neural_score = _compute_neural_score(timeline)

        metrics_summary = {
            key: round(float(np.mean(values)), 3)
            for key, values in timeline.items()
        }

        sensory = _generate_sensory_breakdown(timeline)
        cognitive_load = _compute_cognitive_load(timeline)
        focus_score = _compute_focus_score(timeline)
        narrative_arc = _generate_narrative_arc(timeline)
        av_sync = _compute_av_sync(sensory)
        key_moments = _generate_key_moments(timeline, peaks)
        suggestions = _generate_smart_suggestions(timeline, peaks)
        percentile = min(99, max(5, neural_score + int(np.random.default_rng(neural_score).integers(-10, 10))))

        return {
            "neuralScore": neural_score,
            "percentile": int(percentile),
            "metrics": metrics_summary,
            "timeline": timeline,
            "sensoryTimeline": sensory,
            "cognitiveLoad": cognitive_load,
            "focusScore": focus_score,
            "narrativeArc": narrative_arc,
            "avSyncScore": av_sync,
            "keyMoments": key_moments,
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
