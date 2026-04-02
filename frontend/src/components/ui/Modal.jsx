import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, className = '' }) {
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="fixed inset-0 bg-void/80 backdrop-blur-sm" aria-hidden="true" />
      <div className={`
        relative z-10 w-full max-w-lg rounded-[var(--radius-lg)]
        border border-border bg-depth-1 p-6
        animate-[fade-up_200ms_ease-out]
        ${className}
      `.trim()}>
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="font-display text-lg font-semibold text-text-bright">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-dim hover:text-text-main hover:bg-depth-2 transition-colors"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
