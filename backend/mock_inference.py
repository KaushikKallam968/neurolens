"""
Generate realistic mock analysis results for demo/dev mode.

Produces smooth, convincing timeline data using sine wave combinations
with controlled noise. Designed to look like plausible brain responses
to video content — not random data.
"""

import os
import numpy as np


def _smooth_wave(duration, base_freq, amplitude, phase, noise_level=0.05):
    """
    Generate a smooth sine-based signal with subtle noise.

    Args:
        duration: number of seconds (data points)
        base_freq: base oscillation frequency in Hz
        amplitude: peak amplitude (0.0-1.0)
        phase: phase offset in radians
        noise_level: gaussian noise standard deviation

    Returns:
        numpy array of length `duration`, values in ~0.0-1.0 range
    """
    t = np.linspace(0, duration * base_freq * 2 * np.pi, duration)
    signal = amplitude * np.sin(t + phase)

    # Add a slower drift for natural-looking variation
    drift = 0.15 * np.sin(t * 0.3 + phase * 0.7)

    # Add subtle noise
    noise = np.random.normal(0, noise_level, duration)

    combined = 0.5 + signal + drift + noise
    return np.clip(combined, 0.0, 1.0)


def _inject_peak(signal, center, width=2, height=0.3):
    """Add a gaussian peak at a specific time point."""
    t = np.arange(len(signal))
    peak = height * np.exp(-0.5 * ((t - center) / max(width, 0.5)) ** 2)
    return np.clip(signal + peak, 0.0, 1.0)


def _inject_dip(signal, center, width=2, depth=0.3):
    """Add a gaussian dip (attention drop) at a specific time point."""
    t = np.arange(len(signal))
    dip = depth * np.exp(-0.5 * ((t - center) / max(width, 0.5)) ** 2)
    return np.clip(signal - dip, 0.0, 1.0)


def _safe_list(arr):
    """Convert to list of rounded Python floats."""
    return [round(float(v), 3) for v in arr]


def generate_mock_results(video_path=None, duration=None):
    """
    Generate a complete mock analysis result.

    Args:
        video_path: optional path to video (used to estimate duration)
        duration: override duration in seconds (default 30)

    Returns:
        dict matching the compute_metrics output format
    """
    if duration is None:
        # Try to estimate from filename, fall back to 30s
        duration = _estimate_duration(video_path) if video_path else 30

    np.random.seed(hash(str(video_path or "demo")) % (2**31))

    # Generate base signals with different characteristics
    emotional = _smooth_wave(duration, base_freq=0.08, amplitude=0.2, phase=0.0)
    attention = _smooth_wave(duration, base_freq=0.12, amplitude=0.18, phase=1.2)
    memorability = _smooth_wave(duration, base_freq=0.06, amplitude=0.15, phase=2.4)
    comprehension = _smooth_wave(duration, base_freq=0.05, amplitude=0.12, phase=0.8)
    face_impact = _smooth_wave(duration, base_freq=0.1, amplitude=0.25, phase=3.0, noise_level=0.08)
    scene_impact = _smooth_wave(duration, base_freq=0.07, amplitude=0.2, phase=1.5)
    motion_energy = _smooth_wave(duration, base_freq=0.15, amplitude=0.22, phase=0.5)

    # Strong opening hook — attention and emotion peak in first 2-3 seconds
    attention = _inject_peak(attention, center=1, width=1.5, height=0.35)
    emotional = _inject_peak(emotional, center=2, width=2, height=0.3)

    # Emotional spike around 30-40% through the video
    spike_time = int(duration * 0.35)
    emotional = _inject_peak(emotional, center=spike_time, width=2, height=0.4)
    memorability = _inject_peak(memorability, center=spike_time + 1, width=2, height=0.25)

    # Face moment around 50%
    face_time = int(duration * 0.5)
    face_impact = _inject_peak(face_impact, center=face_time, width=1.5, height=0.4)

    # Attention dip around 60-70% (common mid-video lull)
    dip_time = int(duration * 0.65)
    attention = _inject_dip(attention, center=dip_time, width=3, depth=0.3)

    # Recovery and strong ending
    ending_start = int(duration * 0.85)
    attention = _inject_peak(attention, center=ending_start, width=2, height=0.25)
    emotional = _inject_peak(emotional, center=duration - 2, width=2, height=0.3)

    # High motion at scene transitions
    for t in [int(duration * 0.2), int(duration * 0.45), int(duration * 0.75)]:
        motion_energy = _inject_peak(motion_energy, center=t, width=1, height=0.3)

    timeline = {
        "emotionalResonance": _safe_list(emotional),
        "attentionFocus": _safe_list(attention),
        "memorability": _safe_list(memorability),
        "narrativeComprehension": _safe_list(comprehension),
        "faceImpact": _safe_list(face_impact),
        "sceneImpact": _safe_list(scene_impact),
        "motionEnergy": _safe_list(motion_energy),
    }

    peaks = _generate_mock_peaks(timeline, spike_time, face_time)
    suggestions = _generate_mock_suggestions(timeline, dip_time, duration)
    neural_score = _compute_mock_score(timeline)

    metrics = _compute_metrics_summary(timeline)
    sensory = _generate_sensory_breakdown(duration)
    cognitive_load = _compute_cognitive_load(timeline)
    focus_score = _compute_focus_score(timeline)
    narrative_arc = _generate_narrative_arc(timeline)
    av_sync = _compute_av_sync(sensory)
    key_moments = _generate_key_moments(timeline, peaks, duration)
    percentile = min(99, max(5, neural_score + np.random.randint(-10, 10)))

    return {
        "neuralScore": neural_score,
        "percentile": int(percentile),
        "metrics": metrics,
        "timeline": timeline,
        "sensoryTimeline": sensory,
        "cognitiveLoad": cognitive_load,
        "focusScore": focus_score,
        "narrativeArc": narrative_arc,
        "avSyncScore": av_sync,
        "keyMoments": key_moments,
        "peaks": peaks,
        "suggestions": _generate_smart_suggestions(timeline, dip_time, duration, peaks),
    }


def _compute_metrics_summary(timeline):
    """Compute mean values for each metric as a summary dict."""
    return {
        key: round(float(np.mean(values)), 3)
        for key, values in timeline.items()
    }


def _estimate_duration(video_path):
    """Rough duration estimate. Falls back to 30s if we can't determine it."""
    if video_path is None:
        return 30
    try:
        # Rough heuristic: file size / bitrate estimate
        size_bytes = os.path.getsize(video_path)
        estimated_seconds = max(5, min(120, size_bytes // 500_000))
        return int(estimated_seconds)
    except (OSError, TypeError):
        return 30


def _generate_mock_peaks(timeline, spike_time, face_time):
    """Generate notable peaks from the timeline data."""
    peaks = []

    # Find actual peaks in each metric
    metric_labels = {
        "emotionalResonance": "Emotional spike",
        "attentionFocus": "Attention peak",
        "memorability": "Memory encoding peak",
        "faceImpact": "Strong face response",
        "motionEnergy": "High motion engagement",
    }

    for metric_name, label in metric_labels.items():
        values = timeline[metric_name]
        for i, val in enumerate(values):
            if val >= 0.82:
                peaks.append({
                    "time": round(float(i), 1),
                    "metric": metric_name,
                    "value": round(val, 3),
                    "label": label,
                })

    # Deduplicate — keep highest per second
    seen = {}
    for p in peaks:
        t = p["time"]
        if t not in seen or p["value"] > seen[t]["value"]:
            seen[t] = p

    return sorted(seen.values(), key=lambda p: p["time"])


def _generate_mock_suggestions(timeline, dip_time, duration):
    """Generate actionable suggestions based on the mock data."""
    suggestions = [
        {
            "time": round(float(dip_time), 1),
            "type": "attentionDrop",
            "message": "Attention drops here — consider a visual cut or text overlay",
        },
    ]

    # Check for emotional flatlines
    emotion = timeline["emotionalResonance"]
    for i in range(2, len(emotion)):
        if all(emotion[j] < 0.4 for j in range(i - 2, i + 1)):
            if not any(s["type"] == "emotionalFlatline" for s in suggestions):
                suggestions.append({
                    "time": round(float(i - 1), 1),
                    "type": "emotionalFlatline",
                    "message": "Emotional engagement is flat — try adding music, a face, or a story beat",
                })
            break

    # Check ending strength
    attention = timeline["attentionFocus"]
    if len(attention) >= 2 and attention[-1] < 0.45 and attention[-2] < 0.45:
        suggestions.append({
            "time": round(float(len(attention) - 2), 1),
            "type": "weakEnding",
            "message": "Attention fades at the end — add a strong CTA or closing hook",
        })

    suggestions.sort(key=lambda s: s["time"])
    return suggestions


def _generate_sensory_breakdown(duration):
    """Generate per-second sensory channel contribution (visual/audio/language)."""
    visual = _smooth_wave(duration, 0.06, 0.15, 0.0, 0.03) + 0.35
    audio = _smooth_wave(duration, 0.08, 0.12, 1.5, 0.03) + 0.30
    language = _smooth_wave(duration, 0.04, 0.10, 3.0, 0.02) + 0.20

    total = visual + audio + language
    return {
        "visual": _safe_list(visual / total),
        "audio": _safe_list(audio / total),
        "language": _safe_list(language / total),
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


def _generate_key_moments(timeline, peaks, duration):
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


def _generate_smart_suggestions(timeline, dip_time, duration, peaks):
    """Generate specific, actionable suggestions with recommended actions."""
    suggestions = []
    attention = timeline["attentionFocus"]
    emotion = timeline["emotionalResonance"]
    memory = timeline["memorability"]

    if dip_time < len(attention):
        suggestions.append({
            "time": round(float(dip_time), 1),
            "type": "attentionDrop",
            "severity": "critical",
            "message": "Attention drops significantly here",
            "action": "Add a visual cut, text overlay, or scene change to re-engage viewers",
        })

    for i in range(2, len(emotion)):
        if all(emotion[j] < 0.35 for j in range(i - 2, i + 1)):
            if not any(s["type"] == "emotionalFlatline" for s in suggestions):
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


def _compute_mock_score(timeline):
    """Compute neural score from mock timeline, matching the real formula."""
    emotion_mean = np.mean(timeline["emotionalResonance"])
    attention_mean = np.mean(timeline["attentionFocus"])
    memory_mean = np.mean(timeline["memorability"])
    comprehension_mean = np.mean(timeline["narrativeComprehension"])

    face = np.array(timeline["faceImpact"])
    scene = np.array(timeline["sceneImpact"])
    motion = np.array(timeline["motionEnergy"])
    visual_mean = float(np.mean(np.maximum(np.maximum(face, scene), motion)))

    raw = (
        emotion_mean * 0.30
        + attention_mean * 0.25
        + memory_mean * 0.20
        + comprehension_mean * 0.15
        + visual_mean * 0.10
    )

    return int(round(raw * 100))
