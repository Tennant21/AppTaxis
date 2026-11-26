import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Download, Plus, Trash2 } from 'lucide-react';
import type {
  AppDatabase,
  Infraction,
  InfractionSeverity,
  InfractionStatus,
} from '../types/taxi';
import { ANTANANARIVO_ZONES } from '../data/seedData';
import { exportInfractionsToCSV, formatDateFR } from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import { Input, SearchInput, Select, Textarea } from '../components/ui/FormControls';
import { InfractionSeverityBadge, InfractionStatusBadge } from '../components/ui/Badges';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/States';

interface InfractionsViewProps {
  db: AppDatabase;
  onCreateInfraction: (inf: Partial<Infraction>) => Promise<void>;
  onUpdateInfraction: (id: string, updates: Partial<Infraction>) => Promise<void>;
  onDeleteInfraction: (id: string) => Promise<void>;
  onViewTaxi: (taxiId: string) => void;
}

export const InfractionsView: React.FC<InfractionsViewProps> = ({
  db,
  onCreateInfraction,
  onUpdateInfraction,
  onDeleteInfraction,
  onViewTaxi,
}) => {
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<InfractionSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<InfractionStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Infraction | null>(null);
  const [loading, setLoading] = useState(false);

  const [taxiId, setTaxiId] = useState(db.taxis[0]?.id || '');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState<InfractionSeverity>('MOYENNE');
  const [zone, setZone] = useState('Analakely');
  const [fine, setFine] = useState('50000');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const taxiMap = useMemo(() => new Map(db.taxis.map((t) => [t.id, t])), [db.taxis]);
  const driverMap = useMemo(() => new Map(db.drivers.map((d) => [d.id, d])), [db.drivers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.infractions.filter((inf) => {
      if (severityFilter !== 'ALL' && inf.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && inf.status !== statusFilter) return false;
      if (!q) return true;
      const taxi = taxiMap.get(inf.taxiId);
      const driver = driverMap.get(inf.driverId);
      return (
        inf.type.toLowerCase().includes(q) ||
        inf.description.toLowerCase().includes(q) ||
        inf.zone.toLowerCase().includes(q) ||
        (taxi?.plate.toLowerCase().includes(q) ?? false) ||
        (driver?.fullName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [db.infractions, taxiMap, driverMap, query, severityFilter, statusFilter]);

  const handleExportCSV = () => {
    const csv = exportInfractionsToCSV(filtered, db.taxis, db.drivers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cua-infractions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxiId || !type.trim() || !description.trim()) {
      setFormError('Ce champ est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      await onCreateInfraction({
        taxiId,
        type: type.trim(),
        severity,
        zone,
        fineAmountAriary: Number(fine) || undefined,
        description: description.trim(),
        date: '2026-11-25',
        status: 'OUVERTE',
      });
      setModalOpen(false);
      setType('');
      setDescription('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Infractions</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Suivi des infractions constatées lors des contrôles routiers à Antananarivo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExportCSV}>
            Exporter CSV
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setTaxiId(db.taxis[0]?.id || '');
              setFormError('');
              setModalOpen(true);
            }}
          >
            Enregistrer une infraction
          </Button>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher par plaque, chauffeur, type d’infraction..."
          />
        </div>
        <div className="w-full md:w-[190px]">
          <Select
            label=""
            aria-label="Filtrer par gravité"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as InfractionSeverity | 'ALL')}
            options={[
              { value: 'ALL', label: 'Toutes gravités' },
              { value: 'FAIBLE', label: 'Faible' },
              { value: 'MOYENNE', label: 'Moyenne' },
              { value: 'GRAVE', label: 'Grave' },
              { value: 'TRES_GRAVE', label: 'Très grave' },
            ]}
          />
        </div>
        <div className="w-full md:w-[180px]">
          <Select
            label=""
            aria-label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InfractionStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'Tous statuts' },
              { value: 'OUVERTE', label: 'Ouverte' },
              { value: 'EN_COURS', label: 'En cours' },
              { value: 'REGLEE', label: 'Réglée' },
              { value: 'CONTESTEE', label: 'Contestée' },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-7 w-7" />}
          title="Aucune infraction trouvée"
          description="Aucune infraction ne correspond aux critères sélectionnés."
          actionLabel="Réinitialiser"
          onAction={() => {
            setQuery('');
            setSeverityFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF3C4] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-4">Taxi</th>
                  <th className="py-3.5 px-4">Chauffeur</th>
                  <th className="py-3.5 px-4">Infraction</th>
                  <th className="py-3.5 px-4">Gravité</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Agent</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
                {filtered.map((inf) => {
                  const taxi = taxiMap.get(inf.taxiId);
                  const driver = driverMap.get(inf.driverId);
                  return (
                    <tr key={inf.id} className="hover:bg-[#D8E7FF]/55 transition-colors">
                      <td className="py-3.5 px-5 tabular-nums text-[13px] text-[#52627A] whitespace-nowrap">
                        {formatDateFR(inf.date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {taxi ? (
                          <button
                            type="button"
                            onClick={() => onViewTaxi(taxi.id)}
                            className="plate-badge rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-2.5 py-0.5 text-[12px] text-[#174EA6] hover:border-[#174EA6]"
                          >
                            {taxi.plate}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#263B59] whitespace-nowrap">
                        {driver?.fullName || '—'}
                      </td>
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="font-semibold text-[#172B4D]">{inf.type}</div>
                        <div className="text-[12px] text-[#52627A] truncate">{inf.description}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <InfractionSeverityBadge severity={inf.severity} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <InfractionStatusBadge status={inf.status} />
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-[#52627A] whitespace-nowrap">
                        {inf.agentName}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {inf.status !== 'REGLEE' && (
                            <IconButton
                              label="Marquer comme réglée"
                              onClick={() => onUpdateInfraction(inf.id, { status: 'REGLEE' })}
                            >
                              <CheckCircle className="h-4 w-4 text-[#16A34A]" />
                            </IconButton>
                          )}
                          <IconButton
                            label="Supprimer cette infraction"
                            variant="danger"
                            onClick={() => setDeleteTarget(inf)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enregistrer une infraction"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" type="submit" form="inf-form" loading={loading}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="inf-form" onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-[13px] font-medium text-[#DC2626]">{formError}</p>}
          <Select
            label="Taxi"
            value={taxiId}
            onChange={(e) => setTaxiId(e.target.value)}
            options={db.taxis.map((t) => ({
              value: t.id,
              label: `${t.plate} — ${t.brand} ${t.model}`,
            }))}
          />
          <Input
            label="Type d’infraction"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ex. Défaut d'assurance, refus de contrôle..."
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Gravité"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as InfractionSeverity)}
              options={[
                { value: 'FAIBLE', label: 'Faible' },
                { value: 'MOYENNE', label: 'Moyenne' },
                { value: 'GRAVE', label: 'Grave' },
                { value: 'TRES_GRAVE', label: 'Très grave' },
              ]}
            />
            <Select
              label="Zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              options={ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z }))}
            />
            <Input
              label="Amende (Ar)"
              type="number"
              value={fine}
              onChange={(e) => setFine(e.target.value)}
            />
          </div>
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer cette infraction ?"
        message={`Voulez-vous supprimer l'infraction "${deleteTarget?.type}" ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setLoading(true);
          try {
            await onDeleteInfraction(deleteTarget.id);
            setDeleteTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
};
