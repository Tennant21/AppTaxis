import React from 'react';

interface LogoProps {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  compact = false,
  inverted = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
          inverted ? 'bg-white' : 'bg-[#174EA6]'
        }`}
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Municipal shield + taxi roof beacon */}
          <rect
            x="9"
            y="3"
            width="6"
            height="3"
            rx="1"
            fill="#F4C542"
          />
          <path
            d="M5 10.5C5 8.567 6.567 7 8.5 7H15.5C17.433 7 19 8.567 19 10.5V16.5C19 17.328 18.328 18 17.5 18H6.5C5.672 18 5 17.328 5 16.5V10.5Z"
            stroke={inverted ? '#174EA6' : '#FFFFFF'}
            strokeWidth="1.8"
          />
          <path
            d="M6.5 12H17.5"
            stroke={inverted ? '#174EA6' : '#FFFFFF'}
            strokeWidth="1.5"
          />
          <circle cx="8" cy="15" r="1.1" fill="#F4C542" />
          <circle cx="16" cy="15" r="1.1" fill="#F4C542" />
          <path d="M7 18V20M17 18V20" stroke={inverted ? '#174EA6' : '#FFFFFF'} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div
            className={`text-[14px] font-bold tracking-tight whitespace-nowrap ${
              inverted ? 'text-white' : 'text-[#172B4D]'
            }`}
          >
            Gestion des Taxis
          </div>
          <div
            className={`text-[11px] font-medium leading-snug ${
              inverted ? 'text-white/80' : 'text-[#123B72]'
            }`}
          >
            Commune Urbaine d’Antananarivo
          </div>
        </div>
      )}
    </div>
  );
};
