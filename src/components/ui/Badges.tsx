import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  FileQuestion,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import type {
  DocumentStatus,
  DriverStatus,
  InfractionSeverity,
  InfractionStatus,
  LicenceStatus,
  TaxiStatus,
  UserStatus,
} from '../../types/taxi';

export const TaxiStatusBadge: React.FC<{ status: TaxiStatus }> = ({ status }) => {
  switch (status) {
    case 'AUTORISE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Autorisé
        </span>
      );
    case 'NON_AUTORISE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Non autorisé
        </span>
      );
    case 'SUSPENDU':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#D97706] whitespace-nowrap">
          <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Suspendu
        </span>
      );
    case 'EN_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[12px] font-semibold text-[#2563EB] whitespace-nowrap">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          En vérification
        </span>
      );
  }
};

export const DocumentStatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  switch (status) {
    case 'VALIDE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Valide
        </span>
      );
    case 'BIENTOT_EXPIRE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#D97706] whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Bientôt expiré
        </span>
      );
    case 'EXPIRE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Expiré
        </span>
      );
    case 'MANQUANT':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#52627A] whitespace-nowrap">
          <FileQuestion className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Manquant
        </span>
      );
  }
};

export const LicenceStatusBadge: React.FC<{ status: LicenceStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Active
        </span>
      );
    case 'BIENTOT_EXPIREE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#D97706] whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Expire bientôt
        </span>
      );
    case 'EXPIREE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Expirée
        </span>
      );
    case 'REVOQUEE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Révoquée
        </span>
      );
  }
};

export const InfractionSeverityBadge: React.FC<{ severity: InfractionSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'FAIBLE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#52627A] whitespace-nowrap">
          Faible
        </span>
      );
    case 'MOYENNE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#D97706] whitespace-nowrap">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Moyenne
        </span>
      );
    case 'GRAVE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Grave
        </span>
      );
    case 'TRES_GRAVE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2.5 py-1 text-[12px] font-semibold text-white whitespace-nowrap">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Très grave
        </span>
      );
  }
};

export const InfractionStatusBadge: React.FC<{ status: InfractionStatus }> = ({ status }) => {
  switch (status) {
    case 'OUVERTE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Ouverte
        </span>
      );
    case 'EN_COURS':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[12px] font-semibold text-[#2563EB] whitespace-nowrap">
          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
          En cours
        </span>
      );
    case 'REGLEE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
          <CheckCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Réglée
        </span>
      );
    case 'CONTESTEE':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#D97706] whitespace-nowrap">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Contestée
        </span>
      );
  }
};

export const DriverStatusBadge: React.FC<{ status: DriverStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIF':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
          <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Actif
        </span>
      );
    case 'INACTIF':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#52627A] whitespace-nowrap">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Inactif
        </span>
      );
    case 'SUSPENDU':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
          <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Suspendu
        </span>
      );
  }
};

export const UserStatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  return status === 'ACTIF' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-semibold text-[#16A34A] whitespace-nowrap">
      <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Actif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold text-[#DC2626] whitespace-nowrap">
      <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Désactivé
    </span>
  );
};

export const VerificationBadge: React.FC<{
  state: 'VERIFIED' | 'IN_PROGRESS' | 'FAILED' | 'ATTENTION';
}> = ({ state }) => {
  if (state === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#16A34A]">
        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Vérifié
      </span>
    );
  }
  if (state === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Vérification en cours
      </span>
    );
  }
  if (state === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#DC2626]">
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Vérification impossible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#D97706]">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      Vérification requise
    </span>
  );
};

export const FilterChip: React.FC<{
  label: string;
  tone?: 'default' | 'active' | 'success' | 'warning' | 'error';
  onRemove?: () => void;
}> = ({ label, tone = 'active', onRemove }) => {
  const toneStyles = {
    default: 'bg-[#F7F9FC] text-[#52627A] border-[#DCE4EF]',
    active: 'bg-[#EAF2FB] text-[#174EA6] border-[#C7D2FE]',
    success: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    error: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${toneStyles[tone]}`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer le filtre ${label}`}
          className="rounded-full p-0.5 hover:bg-black/10 transition-colors"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
};
