import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#F2E307] text-[#123B72] hover:bg-[#F8EF55] active:bg-[#F2E307] border border-transparent shadow-[0_2px_7px_rgba(18,59,114,0.10)]',
  secondary:
    'bg-white text-[#174EA6] hover:bg-[#F7F9FC] active:bg-[#EEF4FC] border border-[#DCE4EF] shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  outline:
    'bg-transparent text-[#174EA6] hover:bg-[#EAF2FB] active:bg-[#E0E7FF] border border-[#174EA6]',
  danger:
    'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  ghost:
    'bg-transparent text-[#52627A] hover:bg-[#EAF2FB] hover:text-[#174EA6] active:bg-[#E0E7FF] border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'min-h-[44px] md:min-h-[40px] md:h-[40px] px-4 text-[14px]',
  lg: 'min-h-[48px] md:h-[44px] px-5 text-[14px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174EA6] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'secondary' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = 'ghost',
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const styles =
    variant === 'danger'
      ? 'text-[#DC2626] hover:bg-[#FEE2E2]'
      : variant === 'secondary'
      ? 'bg-white border border-[#DCE4EF] text-[#263B59] hover:bg-[#F7F9FC]'
      : 'text-[#52627A] hover:bg-[#EAF2FB] hover:text-[#174EA6]';

  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 md:h-9 md:w-9 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174EA6] disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
