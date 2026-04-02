export default function Skeleton({
  width,
  height = '1rem',
  rounded = 'var(--radius-sm)',
  className = '',
}) {
  return (
    <div
      className={`bg-depth-3 animate-pulse ${className}`}
      style={{ width, height, borderRadius: rounded }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} role="status" aria-label="Loading text">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  );
}
