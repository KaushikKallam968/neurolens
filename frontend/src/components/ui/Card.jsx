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
        rounded-[20px] border border-white/[0.06] bg-depth-1/25 backdrop-blur-xl
        shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]
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
