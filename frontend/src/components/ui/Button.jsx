import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary text-void hover:bg-primary/90 glow-primary',
  secondary: 'bg-depth-2 text-text-main border border-border hover:border-border-active hover:text-text-bright',
  ghost: 'text-text-dim hover:text-text-main hover:bg-depth-2/50',
  danger: 'bg-score-low/10 text-score-low border border-score-low/20 hover:bg-score-low/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const Button = forwardRef(function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-body font-medium
        rounded-[var(--radius-sm)] transition-all duration-150
        focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
        disabled:opacity-40 disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
