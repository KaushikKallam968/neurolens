import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items = [], className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm font-body">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href || item.label} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-text-ghost" aria-hidden="true" />}
              {isLast || !item.href ? (
                <span className={isLast ? 'text-text-bright' : 'text-text-dim'} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="text-text-dim hover:text-text-main transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
