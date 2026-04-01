# NeuroLens Feature Enhancement Plan

Deep research across Neurons Inc, Dragonfly AI, Attention Insight, content creator tools (Viewstats, Virlo, TubeBuddy), and dashboard design best practices. Plus TribeV2's unique differentiators from the neuromarketing notebook.

---

## Part 1: Features That Only We Can Do (TribeV2 Differentiators)

These features are impossible for eye-tracking competitors like Neurons AI.

### 1.1 Sensory Channel Breakdown
**What**: Show which sense (visual, audio, language) is driving the brain response at each moment.
**Why**: TribeV2 processes all three modalities separately before fusing them. We can mute one channel and measure the delta — something eye-tracking literally cannot do.
**UI**: Stacked bar chart below the timeline. Each second shows the % contribution of visual (green), audio (purple), language (blue). At a glance: "Your audio is carrying this video — the visuals aren't doing much at 0:08."
**Competitive moat**: Neurons can only analyze visuals. We analyze the full sensory experience.

### 1.2 Attention Heatmap on Video Frames
**What**: For each frame of the video, overlay a brain-predicted attention heatmap showing where the brain is directing visual processing.
**Why**: This directly competes with Neurons AI's core product (attention heatmaps) but uses fMRI-predicted V1/V2 activations instead of eye-tracking predictions.
**UI**: Thumbnail strip showing key frames with heatmap overlays. Click to expand. Color: green-yellow-red for low-medium-high activation.

### 1.3 Narrative Arc Visualization
**What**: Plot the "story" of the content as the brain processes it — rising action (emotional buildup), climax (peak activation), resolution (return to baseline).
**Why**: TribeV2 can measure language network activation and emotional processing simultaneously. Eye-tracking only knows where you're looking, not whether the story is landing.
**UI**: A single elegant curve showing the narrative arc with annotations at key inflection points.

### 1.4 Audio-Visual Sync Score
**What**: Measure how well the audio and visual tracks work together. High sync = the brain processes them as one coherent experience. Low sync = the audio fights the visuals.
**Why**: TribeV2's multisensory integration analysis can detect when modalities are working in harmony vs. creating cognitive friction.
**UI**: Single 0-100 score card with a one-line interpretation.

---

## Part 2: Features Borrowed From Best-in-Class Competitors

### 2.1 Cognitive Load Score (from Neurons AI)
**What**: How hard is the brain working to process this content? Low = easy to digest. High = overwhelming.
**Why**: Neurons charges $6K+ for this. We can derive it from frontal cortex activation patterns.
**UI**: Metric card with 0-100 score. Color inverted — green means LOW load (easy), red means HIGH load (overwhelming). With a description like "Viewers need to work hard to process this — simplify visual elements."

### 2.2 Focus Score (from Neurons AI)
**What**: Is attention concentrated on one thing or scattered everywhere?
**Why**: Derived from the distribution of visual cortex activation — concentrated vs. distributed.
**UI**: Metric card with a focus visualization (bullseye icon tight = focused, scattered dots = diffuse).

### 2.3 A/B Comparison Dashboard (from Dragonfly AI)
**What**: Upload two videos, see side-by-side metrics with delta indicators.
**Why**: Dragonfly lets you compare 26+ assets. We start with 2-way comparison.
**UI**: Split view — video A | video B on top. Below: comparison bars for each metric showing which version wins. Green arrows for the winner. "+15% emotional engagement" type callouts.

### 2.4 AI Copilot Recommendations (from Dragonfly AI)
**What**: Instead of just flagging problems, provide specific, actionable recommendations.
**Why**: "Attention drops at 0:08" is a diagnosis, not a prescription. We should say "Add a text overlay or jump cut at 0:08 — similar content with visual interrupts retains 23% more attention."
**UI**: Each insight has a "Fix" button-style badge with a specific recommended action.

### 2.5 Exportable PDF Report (from creator tool research)
**What**: One-click export of the full analysis as a branded PDF.
**Why**: Creators share results with teams and clients. A shareable report is table stakes.
**UI**: "Export Report" button in the header. PDF includes: score, brain screenshot, timeline, metrics, insights.

---

## Part 3: UI Improvements Based on Design Research

### 3.1 Progressive Disclosure — Three-Tier Information Architecture
**Current problem**: Everything shown at once. Dashboard is dense.
**Fix**: Three tiers:
- **Tier 1 (Glance)**: Neural Score + Heat Strip + one-line verdict. Visible without scrolling.
- **Tier 2 (Explore)**: Video + Brain + Timeline + Metric cards. Below the fold.
- **Tier 3 (Deep Dive)**: Click any metric card to expand into full detail with brain isolation.

### 3.2 Fog Map Visualization Option
**What**: Instead of/in addition to the brain view, offer a "fog map" — the actual video frame covered in fog that clears based on predicted neural attention. Like Neurons AI's most popular feature.
**Why**: More intuitive than a 3D brain for most creators. "I can see what parts of my frame the brain notices."
**UI**: Toggle between "Brain View" and "Attention Map" in the viewer panel.

### 3.3 Score Context — Benchmarking
**Current problem**: "Score 72" means nothing without context.
**Fix**: Show percentile: "Better than 68% of analyzed content." Track a running benchmark from all analyzed videos.
**UI**: Below the score number, a small text showing percentile rank. "Top 32%" with a green badge.

### 3.4 Key Moments Thumbnails
**What**: Instead of just a timeline chart, show actual video frame thumbnails at peak/drop moments.
**Why**: Humans process images faster than charts. Seeing the exact frame where attention drops is more useful than reading "0:08" on a timeline.
**UI**: Row of 4-6 thumbnail cards below the timeline, each labeled "Peak Emotion 0:03" or "Attention Drop 0:08" with the actual frame and a colored border.

### 3.5 Onboarding / First-Time User Guide
**What**: Brief overlay that explains what the user is looking at on first use.
**Why**: Brain analytics is unfamiliar. A 3-step tooltip tour reduces confusion.
**UI**: Three tooltips: "This is your Neural Score — higher is better", "This brain lights up where your content activates neurons", "Scroll down for specific recommendations."

### 3.6 Second-by-Second Scrub on Brain
**What**: As user hovers over the timeline OR scrubs the video, the brain updates in real-time.
**Why**: Already partially implemented but needs to be more responsive and obvious.
**UI**: Add a visible "scrubber" cursor on the heat strip that updates the brain instantly. Make the visual change more dramatic (larger color shifts).

### 3.7 Dark/Light Theme Toggle
**What**: Some users prefer light mode, especially when sharing screens or exporting.
**Why**: Accessibility and preference. Dark-only is limiting.
**UI**: Simple toggle in the header. Light theme uses white backgrounds with the same accent colors.

---

## Implementation Priority (Impact x Effort)

### Phase 1 — Quick Wins (highest impact, lowest effort)
1. Score context / percentile benchmarking
2. Better AI recommendations (more specific, actionable)
3. Fog map / attention overlay on video frames
4. Key moments thumbnails

### Phase 2 — Core Differentiators (high impact, medium effort)
5. Sensory channel breakdown (audio vs visual vs language)
6. Cognitive load score
7. Focus score
8. A/B comparison dashboard

### Phase 3 — Polish & Scale (medium impact, higher effort)
9. Export PDF report
10. Narrative arc visualization
11. Audio-visual sync score
12. Onboarding tooltip tour
13. Key moments thumbnails with actual frames
