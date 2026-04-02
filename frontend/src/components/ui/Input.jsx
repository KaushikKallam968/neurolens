import { forwardRef } from 'react';

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

const Input = forwardRef(function Input({
  size = 'md',
  label,
  error,
  className = '',
  id,
  ...props
}, ref) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-mono text-text-dim">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          bg-depth-2 text-text-main border rounded-[var(--radius-sm)]
          font-body placeholder:text-text-ghost
          transition-colors duration-150
          focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30
          ${error ? 'border-score-low' : 'border-border hover:border-border-active'}
          ${sizes[size]} ${className}
        `.trim()}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-score-low" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
