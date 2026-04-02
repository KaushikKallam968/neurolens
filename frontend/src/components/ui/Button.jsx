import { forwardRef } from 'react';

const variants = {
  primary: 'bg-primary text-void hover:bg-primary/90 shadow-[0_8px_24px_rgba(108,159,255,0.25)] hover:shadow-[0_8px_32px_rgba(108,159,255,0.35)]',
  secondary: 'bg-depth-2/30 backdrop-blur-lg text-text-main border border-white/[0.06] hover:border-white/[0.12] hover:text-text-bright hover:bg-depth-2/40',
  ghost: 'text-text-dim hover:text-text-main hover:bg-depth-2/20 hover:backdrop-blur-sm',
  danger: 'bg-score-low/10 backdrop-blur-lg text-score-low border border-score-low/20 hover:bg-score-low/20',
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
