import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {item.icon && <span className="text-muted">{item.icon}</span>}
            {item.href && !isLast ? (
              <Link to={item.href} className="text-muted hover:text-text transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'text-text font-medium' : 'text-muted')}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-muted" />}
          </div>
        );
      })}
    </nav>
  );
}
