import React from 'react';
import { Search, X } from 'lucide-react';

interface FieldWrapperProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  id,
  label,
  required,
  error,
  helper,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    {label ? (
      <label htmlFor={id} className="text-[13px] font-semibold text-[#263B59]">
        {label}
        {required && <span className="ml-1 text-[#DC2626]" aria-hidden="true">*</span>}
      </label>
    ) : null}
    {children}
    {error ? (
      <p className="text-[12px] font-medium text-[#DC2626]" role="alert">
        {error}
      </p>
    ) : helper ? (
      <p className="text-[12px] text-[#52627A]">{helper}</p>
    ) : null}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  error,
  helper,
  success,
  required,
  className = '',
  ...props
}) => {
  const inputId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const borderClass = error
    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15'
    : success
    ? 'border-[#16A34A] focus:border-[#16A34A] focus:ring-[#16A34A]/15'
    : 'border-[#DCE4EF] focus:border-[#174EA6] focus:ring-[#174EA6]/15';

  return (
    <FieldWrapper id={inputId} label={label} required={required} error={error} helper={helper}>
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        className={`h-[44px] md:h-[40px] w-full rounded-[8px] border bg-white px-3 text-[14px] text-[#172B4D] placeholder:text-[#8290A5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-3 disabled:bg-[#F7F9FC] disabled:text-[#8290A5] ${borderClass} ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helper?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  id,
  label,
  error,
  helper,
  options,
  required,
  className = '',
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const borderClass = error
    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15'
    : 'border-[#DCE4EF] focus:border-[#174EA6] focus:ring-[#174EA6]/15';

  return (
    <FieldWrapper id={selectId} label={label} required={required} error={error} helper={helper}>
      <select
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        className={`h-[44px] md:h-[40px] w-full rounded-[8px] border bg-white px-3 text-[14px] text-[#172B4D] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-3 disabled:bg-[#F7F9FC] disabled:text-[#8290A5] ${borderClass} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helper?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  id,
  label,
  error,
  helper,
  required,
  className = '',
  ...props
}) => {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const borderClass = error
    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15'
    : 'border-[#DCE4EF] focus:border-[#174EA6] focus:ring-[#174EA6]/15';

  return (
    <FieldWrapper id={textareaId} label={label} required={required} error={error} helper={helper}>
      <textarea
        id={textareaId}
        required={required}
        aria-invalid={Boolean(error)}
        rows={3}
        className={`w-full rounded-[8px] border bg-white p-3 text-[14px] text-[#172B4D] placeholder:text-[#8290A5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-3 ${borderClass} ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
};

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  onSubmit?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher un taxi, une immatriculation...',
  ariaLabel = 'Rechercher',
  className = '',
  onSubmit,
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-[#8290A5]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-[44px] md:h-[40px] w-full rounded-[8px] border border-[#DCE4EF] bg-white pl-9 pr-9 text-[14px] text-[#172B4D] placeholder:text-[#8290A5] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:border-[#174EA6] focus:outline-none focus:ring-3 focus:ring-[#174EA6]/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute right-2 rounded-full p-1 text-[#8290A5] hover:bg-[#F7F9FC] hover:text-[#172B4D]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export const Switch: React.FC<{
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ id, label, description, checked, onChange, disabled }) => {
  const switchId = id || `switch-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={switchId} className="block text-[14px] font-medium text-[#172B4D]">
          {label}
        </label>
        {description && <p className="text-[13px] text-[#52627A]">{description}</p>}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174EA6] disabled:opacity-50 ${
          checked ? 'bg-[#174EA6]' : 'bg-[#D1D5DB]'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
