import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, disabled, ...props }, ref) => {
    let base =
      'inline-flex items-center justify-center font-mono text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none rounded-md';

    let variantStyles = '';
    switch (variant) {
      case 'outline':
        variantStyles = 'border border-line bg-surface text-ink hover:bg-hoverbg';
        break;
      case 'ghost':
        variantStyles = 'text-muted-ink hover:text-ink hover:bg-hoverbg';
        break;
      case 'destructive':
        variantStyles = 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800';
        break;
      case 'default':
      default:
        variantStyles = 'bg-brand text-brand-fg hover:opacity-90 active:opacity-100 font-semibold';
        break;
    }

    let sizeStyles = '';
    switch (size) {
      case 'sm':
        sizeStyles = 'h-8 px-3 text-xs';
        break;
      case 'lg':
        sizeStyles = 'h-12 px-6 text-base';
        break;
      case 'icon':
        sizeStyles = 'h-9 w-9 p-0';
        break;
      case 'md':
      default:
        sizeStyles = 'h-9 px-4 text-sm';
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
