import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoSelectOnFocus?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, disabled, autoSelectOnFocus, onFocus, onClick, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === 'number' || autoSelectOnFocus) {
        e.currentTarget.select();
      }
      onFocus?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      if (type === 'number' || autoSelectOnFocus) {
        e.currentTarget.select();
      }
      onClick?.(e);
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          disabled={disabled}
          onFocus={handleFocus}
          onClick={handleClick}
          className={cn(
            'w-full h-11 px-3.5 rounded-lg border bg-white text-slate-900 text-sm transition-all outline-none',
            'focus:ring-2 focus:ring-teal-700 focus:border-teal-700',
            'placeholder:text-slate-400 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed',
            error ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
