import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  side?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Drawer({ open, onClose, title, description, children, side = 'right', width = 'md', footer }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [open, onClose]);

  const isRight = side === 'right';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: isRight ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? '100%' : '-100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute top-0 bottom-0 w-full bg-surface shadow-float border-border flex flex-col',
              isRight ? 'right-0 border-l' : 'left-0 border-r',
              widths[width]
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between p-5 border-b border-border">
                <div>
                  {title && <h2 className="font-display font-semibold text-lg text-text">{title}</h2>}
                  {description && <p className="text-sm text-muted mt-1">{description}</p>}
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-muted hover:text-text">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto p-5 flex-1">{children}</div>
            {footer && <div className="p-5 border-t border-border flex items-center justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
