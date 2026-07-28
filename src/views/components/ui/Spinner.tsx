import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-surface-2 border-t-primary',
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingScreen({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
