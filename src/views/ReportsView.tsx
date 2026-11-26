import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import type { AppDatabase, TaxiStatus } from '../types/taxi';
import { ANTANANARIVO_ZONES } from '../data/seedData';
import {
  TAXI_STATUS_LABELS,
  computeDashboardMetrics,
  exportInfractionsToCSV,
  exportTaxisToCSV,
} from '../utils/taxiLogic';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/FormControls';
import { DonutStatusChart, MonthlyBarChart } from '../components/ui/Charts';

export const ReportsView: React.FC<{ db: AppDatabase }> = ({ db }) => {
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<TaxiStatus | 'ALL'>('ALL');
  const [periodFilter, setPeriodFilter] = useState('2026');

  const filteredDb = useMemo<AppDatabase>(() => {
    const taxis = db.taxis.filter((t) => {
      if (zoneFilter !== 'ALL' && t.zone !== zoneFilter) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      return true;
    });
    const ids = new Set(taxis.map((t) => t.id));
    return {
      ...db,
      taxis,
      documents: db.documents.filter((d) => ids.has(d.taxiId)),
      infractions: db.infractions.filter((i) => ids.has(i.taxiId)),
      controls: db.controls.filter((c) => ids.has(c.taxiId)),
    };
  }, [db, zoneFilter, statusFilter]);

  const metrics = computeDashboardMetrics(filteredDb);

  const zoneBreakdown = useMemo(() => {
    return ANTANANARIVO_ZONES.map((zone) => {
      const zTaxis = filteredDb.taxis.filter((t) => t.zone === zone);
      const auth = zTaxis.filter((t) => t.status === 'AUTORISE').length;
      const inf = filteredDb.infractions.filter((i) => i.zone === zone).length;
      return { zone, total: zTaxis.length, authorized: auth, infractions: inf };
    }).filter((row) => row.total > 0 || row.infractions > 0);
  }, [filteredDb]);

  const handleExportTaxis = () => {
    const csv = exportTaxisToCSV(filteredDb.taxis, db.drivers, db.owners);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-taxis-cua-${periodFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportInfractions = () => {
    const csv = exportInfractionsToCSV(filteredDb.infractions, db.taxis, db.drivers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-infractions-cua-${periodFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Rapports & statistiques</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Indicateurs décisionnels et exports administratifs pour les responsables CUA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Imprimer (PDF)
          </Button>
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExportInfractions}>
            CSV Infractions
          </Button>
          <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={handleExportTaxis}>
            Exporter CSV Taxis
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,114,0.06)] grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <Select
          label="Période"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          options={[
            { value: '2026', label: 'Année 2026 (Complet)' },
            { value: '2026-Q4', label: '4e trimestre 2026' },
            { value: '2026-11', label: 'Novembre 2026' },
          ]}
        />
        <Select
          label="Zone d’Antananarivo"
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          options={[
            { value: 'ALL', label: 'Toutes les zones' },
            ...ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z })),
          ]}
        />
        <Select
          label="Statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaxiStatus | 'ALL')}
          options={[
            { value: 'ALL', label: 'Tous les statuts' },
            ...(Object.keys(TAXI_STATUS_LABELS) as TaxiStatus[]).map((s) => ({
              value: s,
              label: TAXI_STATUS_LABELS[s],
            })),
          ]}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-6 shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
          <h3 className="text-[18px] font-semibold text-[#172B4D] mb-4">
            Répartition par statut ({metrics.totalTaxis} taxis)
          </h3>
          <DonutStatusChart segments={metrics.statusBreakdown} total={metrics.totalTaxis} />
        </div>

        <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-6 shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
          <h3 className="text-[18px] font-semibold text-[#172B4D] mb-4">
            Contrôles & infractions mensuels
          </h3>
          <MonthlyBarChart data={metrics.monthlyControlsTrend} />
        </div>
      </div>

      {/* Zone Breakdown Table */}
      <div className="rounded-[12px] border border-[#DCE4EF] bg-white overflow-hidden shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
        <div className="px-6 py-4 border-b border-[#DCE4EF]">
          <h3 className="text-[18px] font-semibold text-[#172B4D]">
            Synthèse par zone géographique
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F9FC] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                <th className="py-3 px-6">Zone</th>
                <th className="py-3 px-4 text-right">Total taxis</th>
                <th className="py-3 px-4 text-right">Autorisés</th>
                <th className="py-3 px-4 text-right">Taux conformité</th>
                <th className="py-3 px-6 text-right">Infractions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
              {zoneBreakdown.map((row) => {
                const rate = row.total > 0 ? Math.round((row.authorized / row.total) * 100) : 0;
                return (
                  <tr key={row.zone} className="hover:bg-white/45">
                    <td className="py-3.5 px-6 font-semibold text-[#172B4D]">{row.zone}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums">{row.total}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-[#16A34A] font-medium">
                      {row.authorized}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-semibold">
                      {rate}%
                    </td>
                    <td className="py-3.5 px-6 text-right tabular-nums text-[#DC2626] font-medium">
                      {row.infractions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
