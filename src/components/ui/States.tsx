import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="rounded-[12px] border border-[#DCE4EF] bg-white overflow-hidden">
    <div className="border-b border-[#DCE4EF] bg-[#F7F9FC] px-5 py-3.5">
      <div className="h-4 w-48 rounded bg-[#DCE4EF] animate-skeleton" />
    </div>
    <div className="divide-y divide-[#DCE4EF]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-4 w-20 rounded bg-[#DCE4EF] animate-skeleton" />
            <div className="h-4 w-32 rounded bg-[#F3F4F6] animate-skeleton" />
            <div className="hidden md:block h-4 w-36 rounded bg-[#F3F4F6] animate-skeleton" />
          </div>
          <div className="h-6 w-24 rounded-full bg-[#DCE4EF] animate-skeleton" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[12px] border border-[#DCE4EF] bg-white p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-[#DCE4EF] animate-skeleton" />
          <div className="h-8 w-20 rounded bg-[#F3F4F6] animate-skeleton" />
          <div className="h-3 w-36 rounded bg-[#F3F4F6] animate-skeleton" />
        </div>
      ))}
    </div>
    <SkeletonTable rows={5} />
  </div>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#DCE4EF] bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF2FB] text-[#174EA6]">
      {icon}
    </div>
    <h3 className="mt-4 text-[18px] font-semibold text-[#172B4D]">{title}</h3>
    <p className="mt-1.5 max-w-md text-[14px] text-[#52627A]">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-5">
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  onBackToDashboard?: () => void;
}> = ({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données.',
  onRetry,
  onBackToDashboard,
}) => (
  <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#FECACA] bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
      <AlertCircle className="h-7 w-7" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-[18px] font-semibold text-[#172B4D]">{title}</h3>
    <p className="mt-1.5 max-w-md text-[14px] text-[#52627A]">{description}</p>
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      {onRetry && (
        <Button variant="primary" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Réessayer
        </Button>
      )}
      {onBackToDashboard && (
        <Button variant="secondary" onClick={onBackToDashboard}>
          Retour au tableau de bord
        </Button>
      )}
    </div>
  </div>
);
