import React, { useMemo, useState } from 'react';
import {
  Ban,
  Car,
  CheckCircle,
  Download,
  Edit3,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { AppDatabase, Taxi, TaxiStatus } from '../types/taxi';
import { ANTANANARIVO_ZONES } from '../data/seedData';
import {
  TAXI_STATUS_LABELS,
  exportTaxisToCSV,
  filterTaxis,
  formatDateFR,
} from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import { SearchInput, Select } from '../components/ui/FormControls';
import { FilterChip, TaxiStatusBadge } from '../components/ui/Badges';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/States';
import { ConfirmDialog, Modal } from '../components/ui/Modal';

interface TaxisViewProps {
  db: AppDatabase;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onViewTaxi: (taxiId: string) => void;
  onOpenAddTaxi: () => void;
  onEditTaxi: (taxi: Taxi) => void;
  onChangeStatus: (taxiId: string, status: TaxiStatus, reason?: string) => Promise<void>;
  onDeleteTaxi: (taxiId: string) => Promise<void>;
}

export const TaxisView: React.FC<TaxisViewProps> = ({
  db,
  searchQuery,
  onSearchQueryChange,
  onViewTaxi,
  onOpenAddTaxi,
  onEditTaxi,
  onChangeStatus,
  onDeleteTaxi,
}) => {
  const [statusFilter, setStatusFilter] = useState<TaxiStatus | 'ALL'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [docHealthFilter, setDocHealthFilter] = useState<'ALL' | 'EXPIRE' | 'BIENTOT_EXPIRE' | 'VALIDE'>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [confirmDeleteTaxi, setConfirmDeleteTaxi] = useState<Taxi | null>(null);
  const [confirmSuspendTaxi, setConfirmSuspendTaxi] = useState<Taxi | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pageSize = db.settings.defaultPageSize || 10;

  const driverMap = useMemo(() => new Map(db.drivers.map((d) => [d.id, d])), [db.drivers]);
  const ownerMap = useMemo(() => new Map(db.owners.map((o) => [o.id, o])), [db.owners]);

  const filteredTaxis = useMemo(
    () =>
      filterTaxis(
        db.taxis,
        db.drivers,
        db.owners,
        db.documents,
        {
          query: searchQuery,
          status: statusFilter,
          zone: zoneFilter,
          docHealth: docHealthFilter,
        },
        db.settings.expiryWarningDays
      ),
    [db.taxis, db.drivers, db.owners, db.documents, db.settings.expiryWarningDays, searchQuery, statusFilter, zoneFilter, docHealthFilter]
  );

  const paginatedTaxis = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTaxis.slice(start, start + pageSize);
  }, [filteredTaxis, currentPage, pageSize]);

  const activeFiltersCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (zoneFilter !== 'ALL' ? 1 : 0) +
    (docHealthFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetFilters = () => {
    onSearchQueryChange('');
    setStatusFilter('ALL');
    setZoneFilter('ALL');
    setDocHealthFilter('ALL');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const csv = exportTaxisToCSV(filteredTaxis, db.drivers, db.owners);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cua-taxis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Taxis enregistrés</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Consultez, filtrez et gérez l’ensemble des taxis en service à Antananarivo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExportCSV}
          >
            Exporter CSV
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={onOpenAddTaxi}
          >
            Ajouter un taxi
          </Button>
        </div>
      </div>

      {/* Search + Filters toolbar */}
      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                onSearchQueryChange(val);
                setCurrentPage(1);
              }}
              placeholder="Rechercher un taxi, une immatriculation, un chauffeur..."
            />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="w-[180px]">
              <Select
                label=""
                aria-label="Filtrer par statut"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TaxiStatus | 'ALL');
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'Tous les statuts' },
                  { value: 'AUTORISE', label: 'Autorisé' },
                  { value: 'EN_VERIFICATION', label: 'En vérification' },
                  { value: 'SUSPENDU', label: 'Suspendu' },
                  { value: 'NON_AUTORISE', label: 'Non autorisé' },
                ]}
                className="mt-0"
              />
            </div>

            <div className="w-[170px]">
              <Select
                label=""
                aria-label="Filtrer par zone"
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'Toutes les zones' },
                  ...ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z })),
                ]}
              />
            </div>

            <div className="w-[190px]">
              <Select
                label=""
                aria-label="Filtrer par état des documents"
                value={docHealthFilter}
                onChange={(e) => {
                  setDocHealthFilter(e.target.value as typeof docHealthFilter);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: 'Tous documents' },
                  { value: 'VALIDE', label: 'Documents valides' },
                  { value: 'BIENTOT_EXPIRE', label: 'Expire bientôt' },
                  { value: 'EXPIRE', label: 'Expiré / Manquant' },
                ]}
              />
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setFiltersOpen(true)}
            >
              Filtrer {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={resetFilters}>
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {statusFilter !== 'ALL' && (
              <FilterChip
                label={TAXI_STATUS_LABELS[statusFilter]}
                tone={
                  statusFilter === 'AUTORISE'
                    ? 'success'
                    : statusFilter === 'SUSPENDU'
                    ? 'warning'
                    : statusFilter === 'NON_AUTORISE'
                    ? 'error'
                    : 'active'
                }
                onRemove={() => setStatusFilter('ALL')}
              />
            )}
            {zoneFilter !== 'ALL' && (
              <FilterChip label={`Zone : ${zoneFilter}`} onRemove={() => setZoneFilter('ALL')} />
            )}
            {docHealthFilter !== 'ALL' && (
              <FilterChip
                label={
                  docHealthFilter === 'EXPIRE'
                    ? 'Docs expirés / manquants'
                    : docHealthFilter === 'BIENTOT_EXPIRE'
                    ? 'Docs bientôt expirés'
                    : 'Docs valides'
                }
                tone={docHealthFilter === 'EXPIRE' ? 'error' : docHealthFilter === 'BIENTOT_EXPIRE' ? 'warning' : 'success'}
                onRemove={() => setDocHealthFilter('ALL')}
              />
            )}
            {searchQuery.trim() && (
              <FilterChip
                label={`Recherche : "${searchQuery}"`}
                onRemove={() => onSearchQueryChange('')}
              />
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#174EA6] hover:underline ml-1"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {db.taxis.length === 0 ? (
        <EmptyState
          icon={<Car className="h-7 w-7" />}
          title="Aucun taxi enregistré"
          description="La base de données ne contient actuellement aucun taxi. Commencez par enregistrer un premier véhicule."
          actionLabel="Ajouter un taxi"
          onAction={onOpenAddTaxi}
        />
      ) : filteredTaxis.length === 0 ? (
        <EmptyState
          icon={<Car className="h-7 w-7" />}
          title="Aucun taxi trouvé"
          description="Aucun taxi ne correspond à votre recherche ou aux filtres sélectionnés."
          actionLabel="Réinitialiser les filtres"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF3C4] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                    <th className="py-3 pl-4 pr-2">N°</th>
                    <th className="py-3 px-2.5">Immatriculation</th>
                    <th className="py-3 px-2.5">Chauffeur</th>
                    <th className="py-3 px-2.5 hidden lg:table-cell">Propriétaire</th>
                    <th className="py-3 px-2.5">Statut</th>
                    <th className="py-3 px-2.5 hidden xl:table-cell">Autorisation</th>
                    <th className="py-3 px-2.5">Validité</th>
                    <th className="py-3 pl-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE4EF] text-[13px]">
                  {paginatedTaxis.map((taxi) => {
                    const driver = driverMap.get(taxi.driverId);
                    const owner = ownerMap.get(taxi.ownerId);
                    return (
                      <tr
                        key={taxi.id}
                        className="h-[58px] hover:bg-[#D8E7FF]/55 transition-colors"
                      >
                        <td className="pl-4 pr-2 text-[12px] font-medium text-[#52627A] tabular-nums whitespace-nowrap">
                          {taxi.taxiNumber}
                        </td>
                        <td className="px-2.5">
                          <div className="flex flex-col items-start gap-0.5">
                            <button
                              type="button"
                              onClick={() => onViewTaxi(taxi.id)}
                              className="plate-badge rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-2.5 py-0.5 text-[12px] text-[#172B4D] hover:border-[#174EA6] hover:text-[#174EA6] transition-colors whitespace-nowrap"
                            >
                              {taxi.plate}
                            </button>
                            <span className="text-[11px] text-[#52627A] truncate max-w-[165px]">
                              {taxi.brand} {taxi.model} · {taxi.zone}
                            </span>
                          </div>
                        </td>
                        <td className="px-2.5 text-[#263B59] max-w-[140px] truncate">
                          {driver?.fullName || 'Non assigné'}
                        </td>
                        <td className="px-2.5 text-[#52627A] max-w-[160px] truncate hidden lg:table-cell">
                          {owner?.fullName || 'Non renseigné'}
                        </td>
                        <td className="px-2.5 whitespace-nowrap">
                          <TaxiStatusBadge status={taxi.status} />
                        </td>
                        <td className="px-2.5 text-[12px] text-[#52627A] tabular-nums whitespace-nowrap hidden xl:table-cell">
                          {taxi.authorizationNumber}
                        </td>
                        <td className="px-2.5 text-[12px] text-[#263B59] tabular-nums whitespace-nowrap">
                          {formatDateFR(taxi.validityDate)}
                        </td>
                        <td className="pl-2 pr-4 text-right whitespace-nowrap relative">
                          <div className="inline-flex items-center gap-1">
                            <IconButton
                              label={`Voir détails de ${taxi.plate}`}
                              onClick={() => onViewTaxi(taxi.id)}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </IconButton>
                            <IconButton
                              label={`Modifier ${taxi.plate}`}
                              onClick={() => onEditTaxi(taxi)}
                            >
                              <Edit3 className="h-4 w-4" aria-hidden="true" />
                            </IconButton>
                            <div className="relative">
                              <IconButton
                                label={`Plus d'options pour ${taxi.plate}`}
                                onClick={() =>
                                  setOpenMenuId(openMenuId === taxi.id ? null : taxi.id)
                                }
                              >
                                <MoreVertical className="h-4 w-4" aria-hidden="true" />
                              </IconButton>
                              {openMenuId === taxi.id && (
                                <div className="absolute right-0 mt-1 w-48 rounded-[8px] border border-[#DCE4EF] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1 z-30 text-left">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onViewTaxi(taxi.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#263B59] hover:bg-[#D8E7FF]"
                                  >
                                    <Eye className="h-4 w-4" /> Voir la fiche complète
                                  </button>
                                  {taxi.status !== 'SUSPENDU' ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setConfirmSuspendTaxi(taxi);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#D97706] hover:bg-[#FEF3C7]/60"
                                    >
                                      <Ban className="h-4 w-4" /> Suspendre le taxi
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        onChangeStatus(taxi.id, 'AUTORISE', 'Réactivation administrative');
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#16A34A] hover:bg-[#DCFCE7]/60"
                                    >
                                      <CheckCircle className="h-4 w-4" /> Réactiver (Autorisé)
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setConfirmDeleteTaxi(taxi);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#DC2626] hover:bg-[#FEE2E2]"
                                  >
                                    <Trash2 className="h-4 w-4" /> Supprimer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedTaxis.map((taxi) => {
              const driver = driverMap.get(taxi.driverId);
              const owner = ownerMap.get(taxi.ownerId);
              return (
                <div
                  key={taxi.id}
                  className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="plate-badge text-[18px] text-[#172B4D]">
                        {taxi.plate}
                      </span>
                      <p className="text-[13px] text-[#52627A]">
                        {taxi.brand} {taxi.model} · {taxi.zone}
                      </p>
                    </div>
                    <TaxiStatusBadge status={taxi.status} />
                  </div>

                  <div className="space-y-1 text-[13px] text-[#52627A] border-t border-[#DCE4EF] pt-3">
                    <p>
                      <span className="font-medium text-[#263B59]">Chauffeur :</span>{' '}
                      {driver?.fullName || 'Non assigné'}
                    </p>
                    <p>
                      <span className="font-medium text-[#263B59]">Propriétaire :</span>{' '}
                      {owner?.fullName || 'Non renseigné'}
                    </p>
                    <p className="tabular-nums">
                      <span className="font-medium text-[#263B59]">Validité :</span>{' '}
                      {formatDateFR(taxi.validityDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => onViewTaxi(taxi.id)}
                    >
                      Voir détails
                    </Button>
                    <IconButton
                      label={`Modifier ${taxi.plate}`}
                      variant="secondary"
                      onClick={() => onEditTaxi(taxi)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label={`Supprimer ${taxi.plate}`}
                      variant="danger"
                      onClick={() => setConfirmDeleteTaxi(taxi)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredTaxis.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="taxis"
          />
        </>
      )}

      {/* Mobile Filter Drawer Modal */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtrer les taxis"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                resetFilters();
                setFiltersOpen(false);
              }}
            >
              Réinitialiser
            </Button>
            <Button variant="primary" onClick={() => setFiltersOpen(false)}>
              Appliquer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Statut"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TaxiStatus | 'ALL');
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Tous les statuts' },
              { value: 'AUTORISE', label: 'Autorisé' },
              { value: 'EN_VERIFICATION', label: 'En vérification' },
              { value: 'SUSPENDU', label: 'Suspendu' },
              { value: 'NON_AUTORISE', label: 'Non autorisé' },
            ]}
          />
          <Select
            label="Zone"
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Toutes les zones' },
              ...ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z })),
            ]}
          />
          <Select
            label="État des documents"
            value={docHealthFilter}
            onChange={(e) => {
              setDocHealthFilter(e.target.value as typeof docHealthFilter);
              setCurrentPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Tous documents' },
              { value: 'VALIDE', label: 'Documents valides' },
              { value: 'BIENTOT_EXPIRE', label: 'Expire bientôt' },
              { value: 'EXPIRE', label: 'Expiré / Manquant' },
            ]}
          />
        </div>
      </Modal>

      {/* Confirm Delete Taxi */}
      <ConfirmDialog
        open={Boolean(confirmDeleteTaxi)}
        onClose={() => setConfirmDeleteTaxi(null)}
        title="Supprimer ce taxi ?"
        message="Cette action est irréversible. Voulez-vous continuer ?"
        confirmLabel="Supprimer"
        variant="danger"
        loading={actionLoading}
        onConfirm={async () => {
          if (!confirmDeleteTaxi) return;
          setActionLoading(true);
          try {
            await onDeleteTaxi(confirmDeleteTaxi.id);
            setConfirmDeleteTaxi(null);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      {/* Confirm Suspend Taxi */}
      <ConfirmDialog
        open={Boolean(confirmSuspendTaxi)}
        onClose={() => setConfirmSuspendTaxi(null)}
        title={`Suspendre le taxi ${confirmSuspendTaxi?.plate || ''} ?`}
        message="Le véhicule ne sera plus autorisé à circuler jusqu'à sa réactivation administrative."
        confirmLabel="Suspendre"
        variant="danger"
        loading={actionLoading}
        onConfirm={async () => {
          if (!confirmSuspendTaxi) return;
          setActionLoading(true);
          try {
            await onChangeStatus(
              confirmSuspendTaxi.id,
              'SUSPENDU',
              'Suspension administrative depuis la liste des taxis'
            );
            setConfirmSuspendTaxi(null);
          } finally {
            setActionLoading(false);
          }
        }}
      />
    </div>
  );
};
