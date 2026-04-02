import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { Card, Button } from './ui';
import { getScoreColor, getScoreLabel } from '../lib/colors';

// L1: Template-based summary from metrics (no LLM, instant)
function generateL1Summary(data) {
  if (!data?.neuralScore) return null;

  const score = data.neuralScore;
  const metrics = data.metrics || {};
  const keyMoments = data.keyMoments || [];

  const parts = [];

  // Overall assessment
  parts.push(getScoreLabel(score));

  // Strongest metric
  const metricEntries = Object.entries(metrics);
  if (metricEntries.length > 0) {
    const sorted = metricEntries.sort((a, b) => b[1] - a[1]);
    const [strongKey, strongVal] = sorted[0];
    const [weakKey, weakVal] = sorted[sorted.length - 1];

    const labels = {
      emotionalResonance: 'emotional resonance',
      attentionFocus: 'attention focus',
      memorability: 'memorability',
      narrativeComprehension: 'narrative comprehension',
      faceImpact: 'face response',
      sceneImpact: 'scene impact',
      motionEnergy: 'motion energy',
    };

    parts.push(`Strongest signal: ${labels[strongKey] || strongKey} (${Math.round(strongVal * 100)}/100).`);
    parts.push(`Weakest area: ${labels[weakKey] || weakKey} (${Math.round(weakVal * 100)}/100).`);
  }

  // Key moments summary
  if (keyMoments.length > 0) {
    const peakCount = keyMoments.filter(m => m.type === 'peak').length;
    const dropCount = keyMoments.filter(m => m.type === 'drop').length;
    if (peakCount > 0) parts.push(`${peakCount} engagement peak${peakCount > 1 ? 's' : ''} detected.`);
    if (dropCount > 0) parts.push(`${dropCount} attention drop${dropCount > 1 ? 's' : ''} — consider editing.`);
  }

  // Retention
  if (data.cognitiveLoad?.score) {
    const cl = data.cognitiveLoad.score;
    if (cl > 75) parts.push('High cognitive load — content may be overwhelming.');
    else if (cl < 35) parts.push('Low cognitive demand — add complexity for better retention.');
  }

  return parts.join(' ');
}

export default function AICopilot({ data, analysisId, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [l2Response, setL2Response] = useState(null);
  const [l2Loading, setL2Loading] = useState(false);
  const [l2Error, setL2Error] = useState(null);
  const responseRef = useRef(null);

  const l1Summary = generateL1Summary(data);

  const requestL2Analysis = useCallback(async () => {
    if (!analysisId) return;
    setL2Loading(true);
    setL2Error(null);
    setL2Response('');

    try {
      const response = await fetch(`/api/analyses/${analysisId}/ai-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Analysis unavailable — try again later');
      }

      // Streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        setL2Response(text);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setL2Response(fullText);
      }
    } catch (err) {
      setL2Error(err.message);
      // Graceful degradation: L1 still shows
    } finally {
      setL2Loading(false);
    }
  }, [analysisId]);

  // Auto-scroll as streaming text arrives
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [l2Response]);

  if (!l1Summary) return null;

  return (
    <Card className={className}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="font-display text-sm font-semibold text-text-bright">AI Copilot</h3>
        </div>
        {expanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
      </button>

      {/* L1: Always visible summary */}
      <p className="text-sm text-text-main font-body mt-3 leading-relaxed">
        {l1Summary}
      </p>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t border-border pt-4"
          >
            {/* L2: Deep analysis */}
            {!l2Response && !l2Loading && (
              <Button
                variant="secondary"
                size="sm"
                onClick={requestL2Analysis}
                disabled={l2Loading}
              >
                <Sparkles size={12} />
                Get deeper analysis
              </Button>
            )}

            {l2Loading && !l2Response && (
              <div className="flex items-center gap-2 text-text-dim text-sm">
                <Loader2 size={14} className="animate-spin" />
                <span>Analyzing with Claude...</span>
              </div>
            )}

            {l2Response && (
              <div
                ref={responseRef}
                className="text-sm text-text-main font-body leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap"
              >
                {l2Response}
                {l2Loading && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
              </div>
            )}

            {l2Error && (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-score-low">{l2Error}</p>
                <button onClick={requestL2Analysis} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <RefreshCw size={10} /> Retry
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
