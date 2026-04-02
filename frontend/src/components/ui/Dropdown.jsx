import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Dropdown({
  trigger,
  items = [],
  onSelect,
  className = '',
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(0);
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setFocusIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusIndex >= 0) {
      e.preventDefault();
      onSelect?.(items[focusIndex]);
      setOpen(false);
    }
  }, [open, focusIndex, items, onSelect]);

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-body
          text-text-main bg-depth-2 border border-border rounded-[var(--radius-sm)]
          hover:border-border-active transition-colors"
      >
        {trigger || 'Select'}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`
            absolute z-40 mt-1 min-w-[180px] py-1
            bg-depth-2 border border-border rounded-[var(--radius-sm)]
            shadow-lg shadow-void/50
            animate-[fade-up_100ms_ease-out]
            ${alignClass}
          `.trim()}
        >
          {items.map((item, i) => (
            <li
              key={item.value ?? item.label ?? i}
              role="option"
              aria-selected={i === focusIndex}
              className={`
                px-3 py-2 text-sm font-body cursor-pointer transition-colors
                ${i === focusIndex ? 'bg-primary-dim text-text-bright' : 'text-text-main hover:bg-depth-3'}
              `.trim()}
              onClick={() => { onSelect?.(item); setOpen(false); }}
              onMouseEnter={() => setFocusIndex(i)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
