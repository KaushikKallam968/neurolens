# NeuroLens — Brain Analytics for Social Content

## What It Is

A web app that uses Meta's TribeV2 model to predict how the human brain responds to video content (Reels, TikToks, ads). Upload a video, get a visual brain analytics dashboard with marketing-useful metrics — not raw neuroscience data.

Inspired by Jake Beau's Instagram demo, rebuilt as a full product with significant improvements.

## Improvements Over Jake Beau's Demo

| Jake Beau | NeuroLens |
|-----------|-----------|
| Notebook/simple demo | Full web dashboard |
| Raw brain visualizations | Marketing-translated metrics |
| Static analysis | Timeline-synced second-by-second |
| Single video | A/B neural comparison |
| Technical audience | Creator-friendly UX |
| No actionable output | Editing suggestions + score |

## Core User Flow

1. User uploads a video (drag-drop or paste URL)
2. Backend runs TribeV2 inference → predicts brain activity
3. Dashboard shows:
   - **Neural Score** (0–100 overall engagement rating)
   - **3D Brain Visualization** (animated, synced to video playback)
   - **Metric Timelines** (emotion, attention, memorability, comprehension)
   - **Frame Heatmap** (which moments trigger strongest responses)
   - **Editing Suggestions** (where attention drops, what to cut/boost)
4. Optional: Upload second video for A/B comparison

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    React Frontend                     │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐ │
│  │ Upload  │ │ 3D Brain │ │ Timelines │ │ A/B    │ │
│  │ Panel   │ │ Viewer   │ │ + Charts  │ │ Compare│ │
│  └─────────┘ └──────────┘ └───────────┘ └────────┘ │
└───────────────────────┬──────────────────────────────┘
                        │ REST API
┌───────────────────────┴──────────────────────────────┐
│                  FastAPI Backend                       │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ Video       │ │ TribeV2      │ │ Metrics       │ │
│  │ Processor   │ │ Inference    │ │ Translator    │ │
│  └─────────────┘ └──────────────┘ └───────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Tech Stack

- **Backend**: Python 3.11, FastAPI, TribeV2, PyTorch
- **Frontend**: React 18 + Vite, Three.js (brain viz), Recharts (timelines), Tailwind CSS
- **Inference**: TribeV2 model from HuggingFace (`facebook/tribev2`)
- **Dev mode**: Mock inference with pre-computed results for instant demos

## Brain-to-Marketing Metrics Mapping

| Metric | Brain Regions | What It Means |
|--------|--------------|---------------|
| Emotional Resonance | TPJ, Amygdala, Insula, Frontal | Content triggers emotional reaction |
| Attention Focus | Frontal, V1/V2 Visual Cortex | Viewer is actively engaged |
| Memorability | Hippocampus, Parahippocampal | Content likely to be remembered |
| Narrative Comprehension | Broca's, Left Temporal | Messaging is understood |
| Face Impact | Fusiform Face Area (FFA) | On-screen faces register strongly |
| Scene Impact | Parahippocampal Place Area (PPA) | Environments/settings register |
| Motion Energy | MT+, EBA | Dynamic visuals land effectively |

**Neural Score formula**: Weighted composite of all metrics, 0–100 scale.
- Emotion: 30%, Attention: 25%, Memorability: 20%, Comprehension: 15%, Visual Impact: 10%

## Frontend Design

### Visual Language
- Dark theme (deep navy/slate, not pure black)
- Accent: Electric cyan (#00D4FF) + Warm coral (#FF6B6B) for contrast
- Glassmorphism cards for metric panels
- Smooth animations on all state changes
- Professional but not clinical — designed for creators, not scientists

### Layout
- **Left panel**: Video player (synced to analysis)
- **Center**: 3D brain visualization (Three.js, rotatable, regions light up)
- **Right panel**: Metrics + score
- **Bottom**: Timeline scrubber with multi-metric overlay
- **Mobile**: Stacked layout, swipeable panels

### 3D Brain Visualization
- Cortical mesh from fsaverage5 (ships with app)
- Regions color-mapped to activation intensity
- Toggle between inflated and folded view
- Click regions for detailed metric breakdown
- Smooth animation synced to video playback

## API Endpoints

```
POST /api/analyze          Upload video, start analysis
GET  /api/results/{id}     Get analysis results (poll for completion)
POST /api/compare          Upload two videos for A/B comparison
GET  /api/health           Health check
```

## File Structure

```
neurolens/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── inference.py          # TribeV2 inference pipeline
│   ├── metrics.py            # Brain-to-marketing metric translation
│   ├── mock_inference.py     # Pre-computed results for dev mode
│   ├── brain_regions.py      # ROI definitions and mapping
│   ├── requirements.txt
│   └── uploads/              # Temp video storage
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Upload.jsx
│   │   │   ├── BrainViewer.jsx
│   │   │   ├── MetricsPanel.jsx
│   │   │   ├── Timeline.jsx
│   │   │   ├── NeuralScore.jsx
│   │   │   ├── CompareView.jsx
│   │   │   └── EditingSuggestions.jsx
│   │   ├── hooks/
│   │   │   └── useAnalysis.js
│   │   ├── lib/
│   │   │   ├── brain-mesh.js
│   │   │   └── colors.js
│   │   └── styles/
│   ├── public/
│   │   └── brain/            # fsaverage5 mesh data
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── docs/
    └── design-spec.md
```

## Scope

**MVP (this build)**:
- Video upload + analysis
- Full dashboard with all metrics
- 3D brain visualization
- Timeline scrubber
- Neural Score
- Editing suggestions
- Mock mode for demo

**Future**:
- URL paste (IG/TikTok link → auto-download)
- A/B comparison
- Export PDF reports
- Batch analysis
- Cloud GPU deployment
- User accounts + history
