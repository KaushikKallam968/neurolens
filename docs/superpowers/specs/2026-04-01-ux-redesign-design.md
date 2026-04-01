# NeuroLens UX Redesign — Design Spec

## The Problem

Current design is generic glassmorphism dark dashboard. Could be any SaaS tool. Doesn't feel like a brain analytics product. Information is flat — all presented at same level. No storytelling, no emotional journey, no delight.

## Target User

Content creators, social media editors, and marketers who make Reels/TikToks and want to understand how their content affects the brain. They:
- Think visually, not scientifically
- Want fast answers: "Is this good? What should I fix?"
- Don't care about brain regions — they care about "does this hook people?"
- Are used to premium tools (Figma, Canva, CapCut) with polished UX
- Want to share results with teams/clients

## Design Philosophy: "Neural Cinema"

The metaphor: You're watching your content through the lens of the human brain. The brain is always present, always alive, always responding. It should feel like a mission control room for content optimization — powerful, focused, cinematic.

## Key Design Principles

1. **Score-first, explore-later** — Lead with the headline number. Everything else is progressive disclosure.
2. **The brain is the hero** — Not squeezed into a grid column. It's THE visual centerpiece.
3. **Cinematic reveal** — After analysis, don't dump everything at once. Build anticipation. Reveal the score dramatically, then unfold the detail layers.
4. **Every number tells a story** — Not just "72" but "72 — Strong hook, attention drops at 0:08. Add a cut."
5. **Timeline is the spine** — The timeline is the primary navigation tool that connects video, brain, and metrics into one synchronized experience.

## Visual Identity

### Color System
Not generic dark theme. A purposeful "neural" palette:

- **Background**: #060B14 (near-black with blue undertone — deep space)
- **Surface Level 1**: #0C1322 (panels, cards)
- **Surface Level 2**: #121B2E (elevated cards, modals)
- **Surface Level 3**: #1A2540 (hover states, active elements)
- **Border**: rgba(99, 145, 255, 0.08) (barely visible blue border)
- **Border Active**: rgba(99, 145, 255, 0.2)

Accents (bioluminescent — inspired by neural firing):
- **Primary**: #6C9FFF (Calm Intelligence — default accent)
- **Score High**: #00E5A0 (Synaptic Green — good scores)
- **Score Mid**: #FFB547 (Amber Alert — mid scores)
- **Score Low**: #FF5C5C (Neural Red — problem areas)
- **Emotion**: #FF6B8A (Warm Coral — emotional resonance)
- **Memory**: #B57FFF (Deep Purple — memorability)
- **Attention**: #FFB547 (Sharp Amber — attention/focus)
- **Language**: #6C9FFF (Cool Blue — comprehension)
- **Visual**: #00E5A0 (Vivid Green — visual impact)

### Typography
- **Display/Score**: Space Grotesk (geometric, tech-forward, distinctive)
- **Body/UI**: Inter (clean, readable, professional)
- **Mono/Data**: JetBrains Mono (for timestamps, technical values)

### Elevation & Depth
Instead of glassmorphism, use subtle layered depth:
- Cards have 1px border with very low opacity blue tint
- No backdrop-blur — too expensive and generic
- Subtle inner glow on active/hover states
- Depth conveyed through background shade progression, not blur

## User Journey

### Phase 1: Upload (The Entry)
- Clean, focused screen. No clutter.
- Large drop zone styled as a "scanning portal" — circular with a brain outline watermark
- Pulsing ring animation around the drop zone
- Tagline: "Drop a video. See what the brain sees."
- Supported formats listed subtly below
- File info appears inside the portal after drop
- "Scan" button (not "Analyze" — more evocative)

### Phase 2: Processing (The Anticipation)
- Full-screen takeover with cinematic loading
- The brain mesh renders and slowly assembles/materializes
- Simulated "scanning" effect — horizontal line sweeps across the brain
- Progress stages shown as text: "Extracting visual features..." → "Mapping audio response..." → "Predicting neural activation..." → "Computing engagement score..."
- The brain gradually lights up as stages complete
- This builds anticipation and communicates the complexity of what's happening

### Phase 3: The Reveal (The Moment)
- Score appears first — big, centered, dramatic
- Animated count-up from 0 to final score
- Score ring fills with color (green/amber/red gradient)
- One-line verdict below: "Strong emotional hook. Attention drops mid-video."
- Brief pause, then dashboard slides in from below/right
- This is the "wow" moment — make it land

### Phase 4: Dashboard (The Exploration)
Full analytical view. Layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  NeuroLens    [file.mp4]    Score: 83    [History] [New Scan]  │
├────────────────────────┬────────────────────────────────────────┤
│                        │                                        │
│     Video Player       │          3D Brain Viewer               │
│     (with scrubber)    │          (hero, large)                 │
│                        │                                        │
├────────────────────────┴────────────────────────────────────────┤
│                                                                 │
│  ═══════════ Neural Timeline (full width) ═══════════════════  │
│  [heat strip: color-coded intensity bar showing at-a-glance]   │
│  [multi-metric area chart below, toggleable]                   │
│                                                                 │
├──────────────────────┬──────────────────────────────────────────┤
│   Metric Cards       │    Insights & Actions                    │
│   (2-col grid)       │    (AI suggestions with timestamps)     │
│   Each with:         │    Each with:                            │
│   - Score + trend    │    - Timestamp (clickable → seeks video) │
│   - One-line meaning │    - Type badge                          │
│   - Mini sparkline   │    - Plain-English recommendation        │
│   - Brain region     │    - Severity indicator                  │
│     highlight on     │                                          │
│     hover            │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

Key differences from current:
- Brain is 50% wider — it's the hero
- Video and brain are side by side on top row (equal importance)
- Timeline has a "heat strip" — a thin color bar showing intensity at-a-glance before the full chart
- Metric cards are below the timeline, not squeezed next to the score
- Insights section is next to metrics, not below everything

### Phase 5: Deep Dive (Optional)
- Click any metric card to expand it into a detailed view
- Shows the full timeline for just that metric
- Shows the brain with ONLY that region highlighted
- Shows all suggestions related to that metric
- Back button to return to overview

## New Features

### 1. Heat Strip
A thin (20px) color-coded bar spanning the full timeline width. Each second is colored by overall neural intensity (green = high engagement, red = low). Gives an instant at-a-glance view of video quality before reading any charts.

### 2. Metric Cards with Context
Each metric card shows:
- Name + icon
- Score (0-100) with color
- One-line interpretation (generated from the data)
  - e.g., "Strong face response — on-screen talent is landing well"
  - e.g., "Attention drops 40% between 0:06-0:10"
- Mini sparkline
- On hover: the corresponding brain region glows brighter

### 3. Smarter Insights
Instead of generic "Attention drops here", provide specific, actionable recommendations:
- "Add a text overlay or visual cut at 0:08 to recover attention"
- "The hook is working — emotional response peaks in the first 2 seconds"
- "Face impact is high at 0:15 — consider extending this shot"
- Grouped by priority (Critical / Opportunity / Strength)

### 4. Comparison Mode
Side-by-side view comparing two analyses:
- Split screen: video A | video B
- Metric comparison bars showing which video wins each dimension
- Delta indicators (+12%, -5%)
- "This version scores 15% higher on emotional engagement"

### 5. Neural Background
Subtle animated particle system in the background:
- Small dots slowly drift and occasionally connect with thin lines
- Creates a "neural network" ambient texture
- Very subtle (opacity 0.03-0.05) — adds life without distraction
- Particles are more active/connected near the brain viewer

## Component Inventory (Redesigned)

| Component | Purpose | Key Change |
|-----------|---------|-----------|
| ScanPortal | Upload zone | Circular portal with brain watermark, not a rectangle |
| ScanningOverlay | Processing state | Cinematic brain assembly, staged progress |
| ScoreReveal | Score presentation | Full-screen dramatic reveal before dashboard |
| DashboardLayout | Main dashboard | New layout with brain hero + heat strip |
| VideoPlayer | Video playback | Cleaner, tighter controls, no browser default chrome |
| BrainViewer | 3D brain | Unchanged (already using real fsaverage5 mesh) |
| HeatStrip | Intensity overview | NEW — color bar showing engagement over time |
| NeuralTimeline | Chart + controls | Redesigned with heat strip above, better toggles |
| MetricCard | Individual metric | Redesigned with interpretation + hover interaction |
| InsightCard | AI suggestion | Redesigned with priority, specific actions, timestamp |
| CompareView | A/B comparison | NEW — side-by-side analysis comparison |
| AnalysisHistory | Past analyses | Redesigned as a clean dropdown, not film strip |
| NeuralBackground | Ambient texture | NEW — subtle particle system |

## Implementation Priority

1. New color system + typography + layout structure
2. Upload portal redesign (ScanPortal)
3. Processing overlay redesign (ScanningOverlay)
4. Score reveal animation (ScoreReveal)
5. Dashboard layout with heat strip
6. Metric cards with interpretations
7. Insight cards with priority grouping
8. Comparison mode
9. Neural background particles
