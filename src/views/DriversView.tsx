import React, { useMemo, useState } from 'react';
import { Edit3, Plus, Trash2, UserCheck } from 'lucide-react';
import type { AppDatabase, Driver, DriverStatus } from '../types/taxi';
import { formatDateFR, formatPhoneMG } from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import { Input, SearchInput, Select } from '../components/ui/FormControls';
import { DriverStatusBadge } from '../components/ui/Badges';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/States';

interface DriversViewProps {
  db: AppDatabase;
  onCreateDriver: (driver: Partial<Driver>) => Promise<void>;
  onUpdateDriver: (id: string, updates: Partial<Driver>) => Promise<void>;
  onDeleteDriver: (id: string) => Promise<void>;
  onViewTaxi: (taxiId: string) => void;
}

export const DriversView: React.FC<DriversViewProps> = ({
  db,
  onCreateDriver,
  onUpdateDriver,
  onDeleteDriver,
  onViewTaxi,
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('2028-01-01');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<DriverStatus>('ACTIF');
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.drivers.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
      );
    });
  }, [db.drivers, query, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setFullName('');
    setPhone('');
    setLicenseNumber('');
    setLicenseExpiry('2028-01-01');
    setAddress('');
    setStatus('ACTIF');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    setFullName(d.fullName);
    setPhone(d.phone);
    setLicenseNumber(d.licenseNumber);
    setLicenseExpiry(d.licenseExpiry);
    setAddress(d.address);
    setStatus(d.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !licenseNumber.trim()) {
      setFormError('Ce champ est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseExpiry,
        address: address.trim() || 'Antananarivo',
        status,
      };
      if (editing) {
        await onUpdateDriver(editing.id, payload);
      } else {
        await onCreateDriver(payload);
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Chauffeurs</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Registre des chauffeurs de taxi agréés et suivi de validité des permis.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Ajouter un chauffeur
        </Button>
      </div>

      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher un chauffeur, téléphone, permis..."
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select
            label=""
            aria-label="Filtrer par statut chauffeur"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DriverStatus | 'ALL')}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'ACTIF', label: 'Actif' },
              { value: 'INACTIF', label: 'Inactif' },
              { value: 'SUSPENDU', label: 'Suspendu' },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="h-7 w-7" />}
          title="Aucun chauffeur trouvé"
          description="Aucun chauffeur ne correspond à vos critères de recherche."
          actionLabel="Réinitialiser"
          onAction={() => {
            setQuery('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF3C4] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                  <th className="py-3.5 px-5">Chauffeur</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4">Permis</th>
                  <th className="py-3.5 px-4">Validité permis</th>
                  <th className="py-3.5 px-4">Taxi affecté</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
                {filtered.map((d) => {
                  const assignedTaxi = db.taxis.find((t) => t.driverId === d.id);
                  return (
                    <tr key={d.id} className="h-[58px] hover:bg-[#D8E7FF]/55 transition-colors">
                      <td className="px-5">
                        <div className="font-semibold text-[#172B4D]">{d.fullName}</div>
                        <div className="text-[12px] text-[#52627A]">{d.address}</div>
                      </td>
                      <td className="px-4 tabular-nums text-[#263B59] whitespace-nowrap">
                        {formatPhoneMG(d.phone)}
                      </td>
                      <td className="px-4 tabular-nums font-medium text-[#172B4D] whitespace-nowrap">
                        {d.licenseNumber}
                      </td>
                      <td className="px-4 tabular-nums text-[#52627A] whitespace-nowrap">
                        {formatDateFR(d.licenseExpiry)}
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        {assignedTaxi ? (
                          <button
                            type="button"
                            onClick={() => onViewTaxi(assignedTaxi.id)}
                            className="plate-badge rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-2.5 py-0.5 text-[12px] text-[#174EA6] hover:border-[#174EA6]"
                          >
                            {assignedTaxi.plate}
                          </button>
                        ) : (
                          <span className="text-[12px] text-[#8290A5]">Non affecté</span>
                        )}
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        <DriverStatusBadge status={d.status} />
                      </td>
                      <td className="px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <IconButton label={`Modifier ${d.fullName}`} onClick={() => openEdit(d)}>
                            <Edit3 className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label={`Supprimer ${d.fullName}`}
                            variant="danger"
                            onClick={() => setDeleteTarget(d)}
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
        title={editing ? `Modifier ${editing.fullName}` : 'Ajouter un chauffeur'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="driver-form" loading={loading}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="driver-form" onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-[13px] font-medium text-[#DC2626]">{formError}</p>}
          <Input
            label="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="034 XX XXX XX"
              required
            />
            <Input
              label="Numéro de permis"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="PC-XXXXXX-T"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Validité du permis"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
            />
            <Select
              label="Statut"
              value={status}
              onChange={(e) => setStatus(e.target.value as DriverStatus)}
              options={[
                { value: 'ACTIF', label: 'Actif' },
                { value: 'INACTIF', label: 'Inactif' },
                { value: 'SUSPENDU', label: 'Suspendu' },
              ]}
            />
          </div>
          <Input
            label="Adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Quartier, Antananarivo"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer ce chauffeur ?"
        message={`Voulez-vous supprimer définitivement la fiche de ${deleteTarget?.fullName} ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setLoading(true);
          try {
            await onDeleteDriver(deleteTarget.id);
            setDeleteTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
};
