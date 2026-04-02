import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function NotificationPanel({ notifications = [], onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="log" aria-label="Notifications">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss?.(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Notification({ notification, onDismiss }) {
  const { type, title, message } = notification;

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-score-high' : 'text-score-low';
  const borderColor = type === 'success' ? 'border-score-high/20' : 'border-score-low/20';

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        bg-depth-1 border ${borderColor} rounded-[var(--radius-md)]
        p-4 shadow-lg shadow-void/50 flex items-start gap-3
      `}
      role="alert"
    >
      <Icon size={18} className={`${iconColor} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-display font-semibold text-text-bright">{title}</p>}
        {message && <p className="text-xs text-text-dim mt-0.5">{message}</p>}
      </div>
      <button
        onClick={onDismiss}
        className="text-text-ghost hover:text-text-dim transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
