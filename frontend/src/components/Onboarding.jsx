import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'neurolens_onboarded';

const steps = [
  {
    message: 'Your Neural Score -- a 0-100 rating of how the brain responds to your content.',
    position: { top: '140px', left: '50%', transform: 'translateX(-50%)' },
    arrowSide: 'top',
  },
  {
    message: 'The 3D brain lights up where your content activates neurons. Drag to rotate.',
    position: { top: '320px', right: '40px' },
    arrowSide: 'left',
  },
  {
    message: 'Scroll down for specific recommendations on what to improve.',
    position: { top: '520px', left: '50%', transform: 'translateX(-50%)' },
    arrowSide: 'top',
  },
];

function ArrowCaret({ side }) {
  const baseClass = 'absolute w-0 h-0';
  const caretStyle = {
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '6px solid #121B2E',
  };

  if (side === 'top') {
    return (
      <div
        className={baseClass}
        style={{ ...caretStyle, top: '-6px', left: '50%', marginLeft: '-6px' }}
      />
    );
  }
  if (side === 'left') {
    return (
      <div
        className={baseClass}
        style={{
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid #121B2E',
          borderLeft: 'none',
          left: '-6px',
          top: '50%',
          marginTop: '-6px',
        }}
      />
    );
  }
  return null;
}

export default function Onboarding() {
  const [step, setStep] = useState(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setStep(0);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleNext = () => {
    if (step >= steps.length - 1) {
      handleDismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleDismiss = () => {
    setStep(null);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (step === null) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="absolute z-40 bg-depth-2 border border-border-active rounded-lg p-4 shadow-2xl"
        style={{ maxWidth: '280px', ...current.position }}
      >
        <ArrowCaret side={current.arrowSide} />

        {/* Step indicator */}
        <span className="font-mono text-xs text-text-ghost">
          {step + 1}/{steps.length}
        </span>

        {/* Message */}
        <p className="font-body text-sm text-text-main mt-1.5 mb-3 leading-relaxed">
          {current.message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="font-body text-xs text-text-dim hover:text-text-main transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 font-body text-sm text-primary font-medium hover:opacity-80 transition-opacity"
          >
            {step >= steps.length - 1 ? 'Got it' : 'Next'}
            {step < steps.length - 1 && <ArrowRight size={14} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
