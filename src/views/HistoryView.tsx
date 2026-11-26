import React, { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import type { AppDatabase, HistoryEvent } from '../types/taxi';
import { formatDateTimeFR } from '../utils/taxiLogic';
import { SearchInput, Select } from '../components/ui/FormControls';
import { EmptyState } from '../components/ui/States';

interface HistoryViewProps {
  db: AppDatabase;
  onViewTaxi: (taxiId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ db, onViewTaxi }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<HistoryEvent['entityType'] | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.history.filter((ev) => {
      if (typeFilter !== 'ALL' && ev.entityType !== typeFilter) return false;
      if (!q) return true;
      return (
        ev.action.toLowerCase().includes(q) ||
        ev.details.toLowerCase().includes(q) ||
        ev.userName.toLowerCase().includes(q)
      );
    });
  }, [db.history, query, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-bold text-[#172B4D]">Historique</h2>
        <p className="mt-1 text-[14px] text-[#52627A]">
          Journal chronologique complet des modifications, vérifications et contrôles administratifs.
        </p>
      </div>

      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une action, un agent, une plaque..."
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <Select
            label=""
            aria-label="Filtrer par catégorie"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as HistoryEvent['entityType'] | 'ALL')}
            options={[
              { value: 'ALL', label: 'Toutes les actions' },
              { value: 'TAXI', label: 'Taxis & documents' },
              { value: 'CONTROLE', label: 'Contrôles terrain' },
              { value: 'INFRACTION', label: 'Infractions' },
              { value: 'LICENCE', label: 'Licences' },
              { value: 'CHAUFFEUR', label: 'Chauffeurs' },
              { value: 'PROPRIETAIRE', label: 'Propriétaires' },
              { value: 'UTILISATEUR', label: 'Utilisateurs' },
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<History className="h-7 w-7" />}
          title="Aucun événement trouvé"
          description="Aucun enregistrement d’historique ne correspond à votre filtre."
          actionLabel="Réinitialiser"
          onAction={() => {
            setQuery('');
            setTypeFilter('ALL');
          }}
        />
      ) : (
        <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <ol className="relative border-l border-[#DCE4EF] ml-2.5 space-y-6">
            {filtered.map((ev) => (
              <li key={ev.id} className="ml-6">
                <span
                  className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[#174EA6] border-2 border-white"
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-[#123B72] tabular-nums">
                    {formatDateTimeFR(ev.dateTime)}
                  </span>
                  {ev.taxiId && (
                    <button
                      type="button"
                      onClick={() => onViewTaxi(ev.taxiId!)}
                      className="text-[12px] font-semibold text-[#174EA6] hover:underline"
                    >
                      Voir le taxi concerné
                    </button>
                  )}
                </div>
                <h3 className="mt-1 text-[15px] font-semibold text-[#172B4D]">{ev.action}</h3>
                <p className="text-[13px] text-[#52627A]">{ev.details}</p>
                <p className="mt-1 text-[12px] text-[#52627A]">par {ev.userName}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
