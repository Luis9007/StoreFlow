import { forwardRef, useState, useEffect, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, onFocus, value, onChange, ...props }, ref) => {
    const inputId = id || props.name;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      onFocus?.(e);
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value === 0 && type === 'number' ? '' : value}
          onFocus={handleFocus}
          onChange={onChange}
          className={cn(
            'w-full h-10 px-3 rounded-xl bg-surface border border-border text-text placeholder:text-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
            error && 'border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  currencySymbol?: string;
  decimals?: number;
}

export function CurrencyInput({
  label,
  error,
  hint,
  id,
  value,
  onChange,
  currencySymbol,
  decimals = 2,
  className,
  onFocus,
  onBlur,
  ...props
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!focused) {
      setInputValue(formatNumberValue(value, decimals));
    }
  }, [value, decimals, focused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    if (value === 0) {
      setInputValue('');
    } else {
      const parts = String(value).split('.');
      const intFormatted = parts[0] ? new Intl.NumberFormat('es-CO').format(parseInt(parts[0], 10)) : '0';
      const decPart = parts[1] ? `,${parts[1]}` : '';
      setInputValue(`${intFormatted}${decPart}`);
    }
    e.target.select();
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!raw.trim()) {
      setInputValue('');
      onChange(0);
      return;
    }

    let intPartRaw = raw;
    let decPartRaw = '';
    const hasComma = raw.includes(',');
    const hasDecimalDot = !hasComma && raw.includes('.') && !raw.match(/\.\d{3}/);

    if (hasComma) {
      const parts = raw.split(',');
      intPartRaw = parts[0];
      decPartRaw = parts.slice(1).join('');
    } else if (hasDecimalDot) {
      const parts = raw.split('.');
      intPartRaw = parts[0];
      decPartRaw = parts.slice(1).join('');
    }

    const intDigits = intPartRaw.replace(/\D/g, '');
    const decDigits = (hasComma || hasDecimalDot) ? decPartRaw.replace(/\D/g, '').slice(0, decimals) : null;

    if (!intDigits && decDigits === null) {
      setInputValue('');
      onChange(0);
      return;
    }

    const formattedInt = intDigits ? new Intl.NumberFormat('es-CO').format(parseInt(intDigits, 10)) : '0';
    const formattedDisplay = decDigits !== null ? `${formattedInt},${decDigits}` : formattedInt;

    setInputValue(formattedDisplay);

    const numStr = `${intDigits || '0'}.${decDigits && decDigits.length > 0 ? decDigits : '0'}`;
    const parsed = parseFloat(numStr);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {currencySymbol && (
          <span className="absolute left-3 text-muted text-sm font-semibold pointer-events-none select-none">
            {currencySymbol}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={focused ? inputValue : formatNumberValue(value, decimals)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder="0,00"
          className={cn(
            'w-full h-10 px-3 rounded-xl bg-surface border border-border text-text placeholder:text-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
            currencySymbol && 'pl-7',
            error && 'border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
}

export function NumberInput({
  label,
  error,
  hint,
  id,
  value,
  onChange,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!focused) {
      setInputValue(formatInteger(value));
    }
  }, [value, focused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    setInputValue(value === 0 ? '' : formatInteger(value));
    e.target.select();
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setInputValue('');
      onChange(0);
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    const formattedDisplay = new Intl.NumberFormat('es-CO').format(parsed);
    setInputValue(formattedDisplay);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={focused ? inputValue : formatInteger(value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder="0"
        className={cn(
          'w-full h-10 px-3 rounded-xl bg-surface border border-border text-text placeholder:text-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
          error && 'border-danger focus:ring-danger/30',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function formatNumberValue(val: number, decimals = 2): string {
  if (isNaN(val) || val === 0) return '0,00';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

function formatInteger(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  return new Intl.NumberFormat('es-CO').format(val);
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 rounded-xl bg-surface border border-border text-text placeholder:text-muted text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 min-h-[80px] resize-y',
            error && 'border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'sf-select w-full h-10 px-3 pr-8 rounded-xl bg-surface border border-border text-text text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none cursor-pointer',
            error && 'border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
