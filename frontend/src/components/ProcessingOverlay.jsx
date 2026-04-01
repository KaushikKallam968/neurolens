import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export default function ProcessingOverlay({ progress = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-8">
        <PulsingBrain />
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-medium text-text-primary mb-2"
          >
            Analyzing neural response...
          </motion.p>
          <p className="text-text-muted text-sm">
            Simulating how the brain processes your content
          </p>
        </div>
        <ProgressBar progress={progress} />
      </div>
    </motion.div>
  );
}

function PulsingBrain() {
  return (
    <div className="relative">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-nl-cyan/30"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
          style={{ width: 80, height: 80, top: -8, left: -8 }}
        />
      ))}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 w-16 h-16 rounded-full bg-nl-cyan/10 flex items-center justify-center"
      >
        <Brain size={32} className="text-nl-cyan" />
      </motion.div>
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="w-64">
      <div className="flex justify-between text-xs text-text-muted mb-2">
        <span>Processing</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-card rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-nl-cyan to-nl-purple rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
