import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ProcessingBadge({ progress = 0, visible = false }) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-full)]
        bg-primary-dim border border-primary/20 text-primary text-xs font-mono"
    >
      <Loader2 size={12} className="animate-spin" />
      <span>Analyzing {Math.round(progress)}%</span>
    </motion.div>
  );
}
