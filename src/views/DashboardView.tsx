import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Ban,
  Car,
  CheckCircle,
  ClipboardCheck,
  FileWarning,
  Plus,
  QrCode,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AppDatabase, AppPage, UserAccount } from '../types/taxi';
import {
  DOCUMENT_TYPE_LABELS,
  computeDashboardMetrics,
  formatDateFR,
  formatDateTimeFR,
} from '../utils/taxiLogic';
import { Button } from '../components/ui/Button';
import { DocumentStatusBadge, TaxiStatusBadge } from '../components/ui/Badges';
import { DonutStatusChart, MonthlyBarChart } from '../components/ui/Charts';

interface DashboardViewProps {
  db: AppDatabase;
  user: UserAccount;
  onNavigate: (page: AppPage, taxiId?: string) => void;
  onOpenAddTaxi: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  user,
  onNavigate,
  onOpenAddTaxi,
}) => {
  const metrics = computeDashboardMetrics(db);
  const taxiMap = new Map(db.taxis.map((t) => [t.id, t]));

  // Couleur commune aux nombres et aux icônes des huit indicateurs.
  const indicatorColor = '#174EA6';

  const statCards = [
    {
      label: 'Taxis enregistrés',
      value: metrics.totalTaxis,
      sub: `${metrics.verificationCount} en vérification`,
      icon: <Car className="h-5 w-5 text-[#174EA6] bg-transparent" aria-hidden="true" />,
      onClick: () => onNavigate('taxis'),
    },
    {
      label: 'Taxis autorisés',
      value: metrics.authorizedCount,
      sub: `${metrics.totalTaxis > 0 ? Math.round((metrics.authorizedCount / metrics.totalTaxis) * 100) : 0}% du parc actif`,
      icon: <CheckCircle className="h-5 w-5 text-[#174EA6] bg-transparent" aria-hidden="true" />,
      onClick: () => onNavigate('taxis'),
    },
    {
      label: 'Non autorisés & suspendus',
      value: metrics.unauthorizedCount + metrics.suspendedCount,
      sub: `${metrics.suspendedCount} suspendu${metrics.suspendedCount > 1 ? 's' : ''} · ${metrics.unauthorizedCount} non autorisé${metrics.unauthorizedCount > 1 ? 's' : ''}`,
      icon: <Ban className="h-5 w-5 text-[#174EA6] bg-transparent" aria-hidden="true" />,
      onClick: () => onNavigate('taxis'),
    },
    {
      label: 'Documents expirés & infractions',
      value: metrics.expiredDocsCount + metrics.openInfractionsCount,
      sub: `${metrics.expiredDocsCount} expirés · ${metrics.openInfractionsCount} infractions ouvertes`,
      icon: <AlertCircle className="h-5 w-5 text-[#174EA6] bg-transparent" aria-hidden="true" />,
      onClick: () => onNavigate('infractions'),
    },
  ];

  // Style commun aux huit cartes du tableau de bord.
  const cardStyle =
    'rounded-[12px] border border-[#DCE4EF] bg-white px-4 py-3.5 text-left shadow-[0_3px_12px_rgba(18,59,114,0.06)] hover:bg-[#F7F9FC] hover:border-[#B8C9DF] transition-all flex items-center justify-between gap-3';

  return (
    <div className="space-y-6">
      {/* Accueil et actions rapides */}
      <section className="dashboard-welcome relative overflow-hidden rounded-[18px] border border-[#174EA6]/15 border-l-0 bg-gradient-to-r from-[#123B72] via-[#174EA6] to-[#2365B8] p-5 md:p-7 shadow-[0_12px_28px_rgba(18,59,114,0.18)] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[22px] md:text-[25px] font-bold text-white">
            Bonjour, {user.firstName}
          </h2>
          <p className="mt-1 text-[14px] text-white/80">
            Vue d’ensemble de la régulation des taxis — {db.settings.municipalityName}
          </p>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={onOpenAddTaxi}
          >
            Ajouter un taxi
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<QrCode className="h-4 w-4" />}
            onClick={() => onNavigate('scanner')}
          >
            Scanner
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Search className="h-4 w-4" />}
            onClick={() => onNavigate('taxis')}
          >
            Rechercher
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<ClipboardCheck className="h-4 w-4" />}
            onClick={() => onNavigate('scanner')}
          >
            Contrôler
          </Button>
        </div>
      </section>

      {/* Les quatre indicateurs principaux */}
      <section
        aria-label="Indicateurs clés"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5"
      >
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className={cardStyle}
          >
            <div className="min-w-0">
              <p className="text-[12px] text-[#52627A]">{card.label}</p>
              <p className="mt-1 text-[20px] font-bold text-[#174EA6] tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-[#52627A] leading-snug">
                {card.sub}
              </p>
            </div>

            <div className="shrink-0 bg-transparent">
              {card.icon}
            </div>
          </button>
        ))}
      </section>

      {/* Les quatre indicateurs complémentaires */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('drivers')}
          className={cardStyle}
        >
          <div>
            <p className="text-[12px] text-[#52627A]">
              Chauffeurs enregistrés
            </p>
            <p className="text-[20px] font-bold text-[#174EA6] tabular-nums">
              {metrics.driversCount}
            </p>
          </div>
          <UserCheck className="h-5 w-5 shrink-0 text-[#174EA6] bg-transparent" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('owners')}
          className={cardStyle}
        >
          <div>
            <p className="text-[12px] text-[#52627A]">
              Propriétaires enregistrés
            </p>
            <p className="text-[20px] font-bold text-[#174EA6] tabular-nums">
              {metrics.ownersCount}
            </p>
          </div>
          <Users className="h-5 w-5 shrink-0 text-[#174EA6] bg-transparent" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('licences')}
          className={cardStyle}
        >
          <div>
            <p className="text-[12px] text-[#52627A]">
              Documents bientôt expirés
            </p>
            <p className="text-[20px] font-bold text-[#174EA6] tabular-nums">
              {metrics.soonExpiringDocsCount}
            </p>
          </div>
          <FileWarning className="h-5 w-5 shrink-0 text-[#174EA6] bg-transparent" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('infractions')}
          className={cardStyle}
        >
          <div>
            <p className="text-[12px] text-[#52627A]">
              Total infractions enregistrées
            </p>
            <p className="text-[20px] font-bold text-[#174EA6] tabular-nums">
              {metrics.totalInfractionsCount}
            </p>
          </div>
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#174EA6] bg-transparent" aria-hidden="true" />
        </button>
      </section>

      {/* Graphiques des statuts et des contrôles */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-5 md:p-6 shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-[18px] font-semibold text-[#172B4D]">
                Répartition des taxis par statut
              </h3>
              <p className="text-[13px] text-[#52627A]">
                État réglementaire en temps réel du parc communal
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-[13px] font-semibold text-[#174EA6] hover:underline whitespace-nowrap"
            >
              Voir rapports
            </button>
          </div>

          <DonutStatusChart
            segments={metrics.statusBreakdown}
            total={metrics.totalTaxis}
          />
        </div>

        <div className="rounded-[12px] border border-[#F0E6A0] !bg-[#fff457b4] p-5 md:p-6 shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-[18px] font-semibold text-[#172B4D]">
                Évolution des contrôles et infractions
              </h3>
              <p className="text-[13px] text-[#52627A]">
                Activité des 5 derniers mois (Juillet – Novembre 2026)
              </p>
            </div>
          </div>

          <MonthlyBarChart data={metrics.monthlyControlsTrend} />
        </div>
      </section>

      {/* Alertes et documents arrivant à expiration */}
      <section className="rounded-[12px] border border-[#DCE4EF] bg-white p-5 md:p-6 shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 items-center rounded-[6px] bg-[#F7F9FC] px-2 text-[12px] font-bold text-[#52627A]">
              Attention
            </span>

            <h3 className="text-[18px] font-semibold text-[#172B4D]">
              Alertes et documents arrivant à expiration
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('licences')}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#174EA6] hover:underline"
          >
            Gérer les licences <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {metrics.expiringAlerts.length === 0 ? (
          <p className="text-[14px] text-[#52627A] py-4">
            Aucun document expiré ou arrivant à échéance dans les prochains {db.settings.expiryWarningDays} jours.
          </p>
        ) : (
          <div className="divide-y divide-[#DCE4EF]">
            {metrics.expiringAlerts.slice(0, 6).map(({ doc, taxi, status, daysRemaining }) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5"
              >
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <span className="plate-badge inline-flex items-center rounded-[6px] border border-[#DCE4EF] bg-[#F7F9FC] px-2.5 py-1 text-[13px] text-[#172B4D]">
                    {taxi.plate}
                  </span>

                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#172B4D]">
                      {DOCUMENT_TYPE_LABELS[doc.type] || doc.label}
                      {doc.documentNumber ? ` · ${doc.documentNumber}` : ''}
                    </p>

                    <p className="text-[12px] text-[#52627A]">
                      {status === 'MANQUANT'
                        ? 'Document manquant dans le dossier'
                        : status === 'EXPIRE'
                        ? `Expiré depuis le ${formatDateFR(doc.expiryDate)}`
                        : `Expire le ${formatDateFR(doc.expiryDate)} (dans ${daysRemaining} jours)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <DocumentStatusBadge status={status} />
                  <Button
                    variant="primary"
                    size="sm"
                    className="!bg-[#fff457] !text-[#123B72] hover:!bg-[#EBDD00] !shadow-none"
                    onClick={() => onNavigate('taxi-detail', taxi.id)}
                  >
                    Voir détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Derniers contrôles terrain */}
      <section className="rounded-[12px] border border-[#DCE4EF] bg-white overflow-hidden shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
        <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-[#DCE4EF]">
          <div>
            <h3 className="text-[18px] font-semibold text-[#172B4D]">
              Derniers contrôles terrain
            </h3>
            <p className="text-[13px] text-[#52627A]">
              Vérifications récentes effectuées par les agents communaux
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-[13px] font-semibold text-[#174EA6] hover:underline whitespace-nowrap"
          >
            Tout l’historique
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F9FC] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                <th className="py-3 px-5">Date & heure</th>
                <th className="py-3 px-4">Immatriculation</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Statut taxi</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
              {db.controls.slice(0, 5).map((ctrl) => {
                const taxi = taxiMap.get(ctrl.taxiId);

                return (
                  <tr key={ctrl.id} className="hover:bg-white/50 transition-colors">
                    <td className="py-3.5 px-5 text-[13px] text-[#52627A] tabular-nums whitespace-nowrap">
                      {formatDateTimeFR(ctrl.dateTime)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="plate-badge rounded-[6px] border border-[#DCE4EF] bg-[#F7F9FC] px-2 py-0.5 text-[13px] text-[#172B4D]">
                        {taxi?.plate || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#263B59] whitespace-nowrap">
                      {ctrl.zone}
                    </td>

                    <td className="py-3.5 px-4 text-[#52627A] whitespace-nowrap">
                      {ctrl.agentName}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {taxi ? <TaxiStatusBadge status={taxi.status} /> : '—'}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {taxi && (
                        <button
                          type="button"
                          onClick={() => onNavigate('taxi-detail', taxi.id)}
                          className="rounded-full bg-[#fff457] px-4 py-2 text-[13px] font-semibold text-[#123B72] hover:bg-[#EBDD00] transition-colors"
                        >
                          Voir dossier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
