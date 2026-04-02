"""
Brain region mapping from fsaverage5 cortical vertices to marketing-useful ROIs.

Uses approximate vertex index ranges on the fsaverage5 mesh (10,242 vertices per
hemisphere) based on Destrieux/Desikan-Killiany atlas labels. Left hemisphere
vertices are 0-10,241, right hemisphere are 10,242-20,483.
"""

import numpy as np


# fsaverage5 has 10,242 vertices per hemisphere (20,484 total)
VERTICES_PER_HEMISPHERE = 10242

# Approximate vertex index ranges for each ROI on fsaverage5
# Format: list of (start, end) tuples — ranges are inclusive on both ends
# Left hemisphere (L) = 0..10241, Right hemisphere (R) = 10242..20483

ROI_DEFINITIONS = {
    # --- Emotional Processing ---
    "tpj": {
        "label": "Temporo-Parietal Junction",
        "category": "emotional",
        "description": "Social cognition, empathy, theory of mind",
        "vertices": [
            (6200, 6500),   # left TPJ
            (16442, 16742), # right TPJ
        ],
    },
    "amygdala": {
        "label": "Amygdala",
        "category": "emotional",
        "description": "Fear, emotional salience, threat detection",
        # Amygdala is subcortical — approximate via nearby temporal pole vertices
        "vertices": [
            (1100, 1350),   # left amygdala-adjacent
            (11342, 11592), # right amygdala-adjacent
        ],
    },
    "insula": {
        "label": "Insula",
        "category": "emotional",
        "description": "Disgust, interoception, empathy, risk perception",
        "vertices": [
            (3500, 3850),   # left anterior insula
            (13742, 14092), # right anterior insula
        ],
    },
    "vmpfc": {
        "label": "Ventromedial Prefrontal Cortex",
        "category": "emotional",
        "description": "Value judgments, brand preference, reward anticipation",
        "vertices": [
            (800, 1100),    # left vmPFC
            (11042, 11342), # right vmPFC
        ],
    },

    # --- Attention ---
    "dlpfc": {
        "label": "Dorsolateral Prefrontal Cortex",
        "category": "attention",
        "description": "Working memory, executive control, sustained attention",
        "vertices": [
            (2000, 2450),   # left dlPFC
            (12242, 12692), # right dlPFC
        ],
    },
    "v1_v2": {
        "label": "V1/V2 Visual Cortex",
        "category": "attention",
        "description": "Primary visual processing, edge and contrast detection",
        "vertices": [
            (8800, 9400),   # left V1/V2 (calcarine sulcus region)
            (19042, 19642), # right V1/V2
        ],
    },
    "fef": {
        "label": "Frontal Eye Fields",
        "category": "attention",
        "description": "Visual search, saccade control, voluntary attention shifts",
        "vertices": [
            (2450, 2700),   # left FEF
            (12692, 12942), # right FEF
        ],
    },

    # --- Memory ---
    "hippocampus": {
        "label": "Hippocampus",
        "category": "memory",
        "description": "Episodic memory encoding, recall, spatial navigation",
        # Subcortical — approximate via medial temporal vertices
        "vertices": [
            (5000, 5300),   # left hippocampal region
            (15242, 15542), # right hippocampal region
        ],
    },
    "parahippocampal": {
        "label": "Parahippocampal Cortex",
        "category": "memory",
        "description": "Contextual associations, scene memory encoding",
        "vertices": [
            (5300, 5650),   # left parahippocampal
            (15542, 15892), # right parahippocampal
        ],
    },

    # --- Language ---
    "broca": {
        "label": "Broca's Area",
        "category": "language",
        "description": "Speech production, syntactic processing",
        "vertices": [
            (2700, 3050),   # left inferior frontal gyrus (pars opercularis/triangularis)
        ],
    },
    "wernicke": {
        "label": "Wernicke's Area",
        "category": "language",
        "description": "Speech comprehension, semantic processing",
        "vertices": [
            (6500, 6850),   # left posterior superior temporal gyrus
        ],
    },
    "left_temporal": {
        "label": "Left Temporal Lobe",
        "category": "language",
        "description": "Auditory processing, language comprehension, narrative understanding",
        "vertices": [
            (4500, 5000),   # left superior/middle temporal
        ],
    },

    # --- Visual Specialization ---
    "ffa": {
        "label": "Fusiform Face Area",
        "category": "visual",
        "description": "Face recognition, celebrity identification, social processing",
        "vertices": [
            (7200, 7500),   # left FFA (fusiform gyrus)
            (17442, 17742), # right FFA
        ],
    },
    "ppa": {
        "label": "Parahippocampal Place Area",
        "category": "visual",
        "description": "Scene and place recognition, spatial layout processing",
        "vertices": [
            (5650, 5950),   # left PPA
            (15892, 16192), # right PPA
        ],
    },
    "eba": {
        "label": "Extrastriate Body Area",
        "category": "visual",
        "description": "Body and body-part perception, action observation",
        "vertices": [
            (7500, 7800),   # left EBA (lateral occipitotemporal)
            (17742, 18042), # right EBA
        ],
    },
    "mt_plus": {
        "label": "MT+ (V5) Motion Area",
        "category": "visual",
        "description": "Motion perception, visual flow, dynamic scene analysis",
        "vertices": [
            (7800, 8100),   # left MT+
            (18042, 18342), # right MT+
        ],
    },
}

# Category groupings for convenience
CATEGORIES = {
    "emotional": ["tpj", "amygdala", "insula", "vmpfc"],
    "attention": ["dlpfc", "v1_v2", "fef"],
    "memory": ["hippocampus", "parahippocampal"],
    "language": ["broca", "wernicke", "left_temporal"],
    "visual": ["ffa", "ppa", "eba", "mt_plus"],
}


def _extract_vertex_values(predictions, vertex_ranges):
    """
    Extract values from predictions array for given vertex ranges.

    Args:
        predictions: numpy array of shape (n_vertices,) or (n_timesteps, n_vertices)
        vertex_ranges: list of (start, end) tuples

    Returns:
        numpy array of extracted values (flattened across all ranges)
    """
    indices = []
    n_vertices = predictions.shape[-1]

    for start, end in vertex_ranges:
        clamped_end = min(end, n_vertices - 1)
        clamped_start = min(start, n_vertices - 1)
        if clamped_start <= clamped_end:
            indices.extend(range(clamped_start, clamped_end + 1))

    if not indices:
        return np.zeros(1) if predictions.ndim == 1 else np.zeros((predictions.shape[0], 1))

    indices = np.array(indices)

    if predictions.ndim == 1:
        return predictions[indices]
    else:
        return predictions[:, indices]


def get_roi_activation(predictions, roi_name):
    """
    Extract mean activation for a given ROI from vertex predictions.

    Args:
        predictions: numpy array of shape (n_vertices,) or (n_timesteps, n_vertices)
        roi_name: string key from ROI_DEFINITIONS (e.g. "amygdala", "ffa")

    Returns:
        float (single timepoint) or numpy array of shape (n_timesteps,) with mean activation

    Raises:
        ValueError: if roi_name is not recognized
    """
    roi_name = roi_name.lower()
    if roi_name not in ROI_DEFINITIONS:
        raise ValueError(
            f"Unknown ROI '{roi_name}'. Available: {list(ROI_DEFINITIONS.keys())}"
        )

    roi = ROI_DEFINITIONS[roi_name]
    values = _extract_vertex_values(predictions, roi["vertices"])

    if predictions.ndim == 1:
        return float(np.mean(values))
    else:
        return np.mean(values, axis=1)


def get_category_activation(predictions, category):
    """
    Get mean activation across all ROIs in a category.

    Args:
        predictions: numpy array of shape (n_vertices,) or (n_timesteps, n_vertices)
        category: one of "emotional", "attention", "memory", "language", "visual"

    Returns:
        float or numpy array of mean activation across all ROIs in the category
    """
    category = category.lower()
    if category not in CATEGORIES:
        raise ValueError(
            f"Unknown category '{category}'. Available: {list(CATEGORIES.keys())}"
        )

    roi_activations = []
    for roi_name in CATEGORIES[category]:
        activation = get_roi_activation(predictions, roi_name)
        roi_activations.append(activation)

    return np.mean(roi_activations, axis=0)


def get_all_roi_activations(predictions):
    """
    Compute mean activation for every defined ROI.

    Args:
        predictions: numpy array of shape (n_vertices,) or (n_timesteps, n_vertices)

    Returns:
        dict mapping roi_name -> activation (float or array)
    """
    result = {}
    for roi_name in ROI_DEFINITIONS:
        result[roi_name] = get_roi_activation(predictions, roi_name)
    return result


def list_rois():
    """Return a list of all available ROI names with their metadata."""
    return {
        name: {
            "label": roi["label"],
            "category": roi["category"],
            "description": roi["description"],
        }
        for name, roi in ROI_DEFINITIONS.items()
    }
