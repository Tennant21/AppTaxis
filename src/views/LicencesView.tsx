import React, { useMemo, useState } from 'react';
import { Award, Ban, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { AppDatabase, LicenceAuthorization, LicenceStatus } from '../types/taxi';
import { ANTANANARIVO_ZONES } from '../data/seedData';
import { computeLicenceStatus, formatDateFR } from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import { Input, SearchInput, Select } from '../components/ui/FormControls';
import { LicenceStatusBadge } from '../components/ui/Badges';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/States';

interface LicencesViewProps {
  db: AppDatabase;
  onCreateLicence: (lic: Partial<LicenceAuthorization>) => Promise<void>;
  onUpdateLicence: (id: string, updates: Partial<LicenceAuthorization>) => Promise<void>;
  onDeleteLicence: (id: string) => Promise<void>;
  onViewTaxi: (taxiId: string) => void;
}

export const LicencesView: React.FC<LicencesViewProps> = ({
  db,
  onCreateLicence,
  onUpdateLicence,
  onDeleteLicence,
  onViewTaxi,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LicenceStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<LicenceAuthorization | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LicenceAuthorization | null>(null);
  const [loading, setLoading] = useState(false);

  const [taxiId, setTaxiId] = useState(db.taxis[0]?.id || '');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [authorizationNumber, setAuthorizationNumber] = useState('');
  const [zone, setZone] = useState('Analakely');
  const [issueDate, setIssueDate] = useState('2026-11-25');
  const [expiryDate, setExpiryDate] = useState('2027-11-25');
  const [formError, setFormError] = useState('');

  const taxiMap = useMemo(() => new Map(db.taxis.map((t) => [t.id, t])), [db.taxis]);

  const enriched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.licences
      .map((l) => ({
        ...l,
        computedStatus: computeLicenceStatus(l, db.settings.expiryWarningDays),
        taxi: taxiMap.get(l.taxiId),
      }))
      .filter((item) => {
        if (statusFilter !== 'ALL' && item.computedStatus !== statusFilter) return false;
        if (!q) return true;
        return (
          item.licenceNumber.toLowerCase().includes(q) ||
          item.authorizationNumber.toLowerCase().includes(q) ||
          item.zone.toLowerCase().includes(q) ||
          (item.taxi?.plate.toLowerCase().includes(q) ?? false)
        );
      });
  }, [db.licences, db.settings.expiryWarningDays, taxiMap, query, statusFilter]);

  const openAdd = () => {
    setTaxiId(db.taxis[0]?.id || '');
    setLicenceNumber(`LIC-CUA-${Math.floor(1000 + Math.random() * 8999)}`);
    setAuthorizationNumber(`AUT-2026-${Math.floor(1000 + Math.random() * 8999)}`);
    setZone('Analakely');
    setIssueDate('2026-11-25');
    setExpiryDate('2027-11-25');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxiId || !licenceNumber.trim() || !authorizationNumber.trim()) {
      setFormError('Ce champ est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      await onCreateLicence({
        taxiId,
        licenceNumber: licenceNumber.trim(),
        authorizationNumber: authorizationNumber.trim(),
        zone,
        issueDate,
        expiryDate,
        status: 'ACTIVE',
      });
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Licences & autorisations</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Délivrance, renouvellement et révocation des licences communales de transport.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Délivrer une licence
        </Button>
      </div>

      <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,114,0.06)] flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher par licence, autorisation, plaque, zone..."
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <Select
            label=""
            aria-label="Filtrer par statut de licence"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LicenceStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'BIENTOT_EXPIREE', label: 'Expire bientôt' },
              { value: 'EXPIREE', label: 'Expirée' },
              { value: 'REVOQUEE', label: 'Révoquée' },
            ]}
          />
        </div>
      </div>

      {enriched.length === 0 ? (
        <EmptyState
          icon={<Award className="h-7 w-7" />}
          title="Aucune licence trouvée"
          description="Aucune licence ne correspond aux filtres appliqués."
          actionLabel="Réinitialiser"
          onAction={() => {
            setQuery('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-[12px] border border-[#DCE4EF] bg-white shadow-[0_3px_12px_rgba(18,59,114,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F9FC] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                  <th className="py-3.5 px-5">Licence</th>
                  <th className="py-3.5 px-4">Autorisation</th>
                  <th className="py-3.5 px-4">Taxi</th>
                  <th className="py-3.5 px-4">Zone</th>
                  <th className="py-3.5 px-4">Validité</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
                {enriched.map((l) => (
                  <tr key={l.id} className="h-[58px] hover:bg-white/55 transition-colors">
                    <td className="px-5 font-semibold text-[#172B4D] tabular-nums whitespace-nowrap">
                      {l.licenceNumber}
                    </td>
                    <td className="px-4 text-[#52627A] tabular-nums whitespace-nowrap">
                      {l.authorizationNumber}
                    </td>
                    <td className="px-4 whitespace-nowrap">
                      {l.taxi ? (
                        <button
                          type="button"
                          onClick={() => onViewTaxi(l.taxi!.id)}
                          className="plate-badge rounded-full border border-[#DCE4EF] bg-[#F7F9FC] px-2.5 py-0.5 text-[12px] text-[#174EA6] hover:border-[#174EA6]"
                        >
                          {l.taxi.plate}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 text-[#263B59] whitespace-nowrap">{l.zone}</td>
                    <td className="px-4 tabular-nums text-[#52627A] whitespace-nowrap">
                      {formatDateFR(l.issueDate)} → {formatDateFR(l.expiryDate)}
                    </td>
                    <td className="px-4 whitespace-nowrap">
                      <LicenceStatusBadge status={l.computedStatus} />
                    </td>
                    <td className="px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <IconButton
                          label="Renouveler 1 an"
                          onClick={() =>
                            onUpdateLicence(l.id, {
                              status: 'ACTIVE',
                              issueDate: '2026-11-25',
                              expiryDate: '2027-11-25',
                            })
                          }
                        >
                          <RefreshCw className="h-4 w-4" />
                        </IconButton>
                        {l.computedStatus !== 'REVOQUEE' && (
                          <IconButton
                            label="Révoquer la licence"
                            variant="danger"
                            onClick={() => setRevokeTarget(l)}
                          >
                            <Ban className="h-4 w-4" />
                          </IconButton>
                        )}
                        <IconButton
                          label="Supprimer la licence"
                          variant="danger"
                          onClick={() => setDeleteTarget(l)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Délivrer une licence & autorisation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="licence-form" loading={loading}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="licence-form" onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-[13px] font-medium text-[#DC2626]">{formError}</p>}
          <Select
            label="Taxi concerné"
            value={taxiId}
            onChange={(e) => setTaxiId(e.target.value)}
            options={db.taxis.map((t) => ({
              value: t.id,
              label: `${t.plate} — ${t.brand} ${t.model} (${t.zone})`,
            }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="N° de licence"
              value={licenceNumber}
              onChange={(e) => setLicenceNumber(e.target.value)}
              required
            />
            <Input
              label="N° d’autorisation"
              value={authorizationNumber}
              onChange={(e) => setAuthorizationNumber(e.target.value)}
              required
            />
          </div>
          <Select
            label="Zone autorisée"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            options={ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date d’émission"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <Input
              label="Date d’expiration"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        title="Révoquer cette licence ?"
        message={`La licence ${revokeTarget?.licenceNumber} sera révoquée et le taxi associé passera en statut Suspendu.`}
        confirmLabel="Révoquer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!revokeTarget) return;
          setLoading(true);
          try {
            await onUpdateLicence(revokeTarget.id, { status: 'REVOQUEE' });
            setRevokeTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer cette licence ?"
        message="Cette action est irréversible. Voulez-vous continuer ?"
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setLoading(true);
          try {
            await onDeleteLicence(deleteTarget.id);
            setDeleteTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
};
