import { forwardRef } from 'react';

const Card = forwardRef(function Card({
  className = '',
  padding = true,
  glow = false,
  children,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={`
        rounded-[var(--radius-lg)] border border-border bg-depth-1/50
        ${padding ? 'p-5' : ''}
        ${glow ? 'glow-primary' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
});

export default Card;
