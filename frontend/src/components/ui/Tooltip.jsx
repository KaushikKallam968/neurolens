import { useState, useRef, useCallback } from 'react';

export default function Tooltip({ content, children, position = 'top', className = '' }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={`
            absolute z-50 px-3 py-1.5 text-xs font-body text-text-bright
            bg-depth-3 border border-border rounded-[var(--radius-sm)]
            whitespace-nowrap pointer-events-none
            animate-[fade-up_150ms_ease-out]
            ${positionClasses[position]}
          `.trim()}
        >
          {content}
        </div>
      )}
    </div>
  );
}
