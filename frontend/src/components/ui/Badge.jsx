import { forwardRef } from 'react';

const variants = {
  default: 'bg-depth-3 text-text-main border-border',
  success: 'bg-score-high/10 text-score-high border-score-high/20',
  warning: 'bg-score-mid/10 text-score-mid border-score-mid/20',
  danger: 'bg-score-low/10 text-score-low border-score-low/20',
  primary: 'bg-primary-dim text-primary border-primary/20',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const Badge = forwardRef(function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}, ref) {
  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center font-mono border rounded-[var(--radius-full)]
        ${variants[variant]} ${sizes[size]} ${className}
      `.trim()}
      {...props}
    >
      {children}
    </span>
  );
});

export default Badge;
