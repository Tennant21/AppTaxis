import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle,
  Download,
  Edit3,
  FileText,
  History,
  Info,
  Plus,
  Printer,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import type {
  AppDatabase,
  DocumentType,
  Infraction,
  InfractionSeverity,
  Taxi,
  TaxiDocument,
  TaxiStatus,
} from '../types/taxi';
import {
  DOCUMENT_TYPE_LABELS,
  computeDocumentStatus,
  exportTaxisToCSV,
  formatDateFR,
  formatDateTimeFR,
  formatPhoneMG,
} from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import {
  DocumentStatusBadge,
  DriverStatusBadge,
  InfractionSeverityBadge,
  InfractionStatusBadge,
  TaxiStatusBadge,
  VerificationBadge,
} from '../components/ui/Badges';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/FormControls';
import { FileUploadZone, type UploadedFileMeta } from '../components/ui/FileUploadZone';

interface TaxiDetailViewProps {
  db: AppDatabase;
  taxiId: string;
  onBack: () => void;
  onEditTaxi: (taxi: Taxi) => void;
  onChangeStatus: (taxiId: string, status: TaxiStatus, reason?: string) => Promise<void>;
  onAddDocument: (doc: Partial<TaxiDocument>) => Promise<void>;
  onVerifyDocument: (docId: string, verified: boolean) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onAddInfraction: (inf: Partial<Infraction>) => Promise<void>;
}

type DetailTab = 'informations' | 'documents' | 'infractions' | 'historique';

export const TaxiDetailView: React.FC<TaxiDetailViewProps> = ({
  db,
  taxiId,
  onBack,
  onEditTaxi,
  onChangeStatus,
  onAddDocument,
  onVerifyDocument,
  onDeleteDocument,
  onAddInfraction,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('informations');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState<TaxiDocument | null>(null);
  const [infractionModalOpen, setInfractionModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add Document state
  const [docType, setDocType] = useState<DocumentType>('ASSURANCE');
  const [docNumber, setDocNumber] = useState('');
  const [docIssue, setDocIssue] = useState('2026-11-25');
  const [docExpiry, setDocExpiry] = useState('2027-11-25');
  const [docFile, setDocFile] = useState<UploadedFileMeta | null>(null);
  const [docError, setDocError] = useState('');

  // Add Infraction state
  const [infType, setInfType] = useState('');
  const [infSeverity, setInfSeverity] = useState<InfractionSeverity>('MOYENNE');
  const [infDesc, setInfDesc] = useState('');
  const [infZone, setInfZone] = useState('');
  const [infError, setInfError] = useState('');

  const taxi = db.taxis.find((t) => t.id === taxiId);
  if (!taxi) {
    return (
      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-8 text-center">
        <p className="text-[16px] font-semibold text-[#172B4D]">Taxi introuvable</p>
        <div className="mt-4">
          <Button variant="secondary" onClick={onBack}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const owner = db.owners.find((o) => o.id === taxi.ownerId);
  const driver = db.drivers.find((d) => d.id === taxi.driverId);
  const taxiDocs = db.documents.filter((d) => d.taxiId === taxi.id);
  const taxiInfractions = db.infractions.filter((i) => i.taxiId === taxi.id);
  const taxiHistory = db.history.filter(
    (h) => h.taxiId === taxi.id || h.entityId === taxi.id
  );

  const handleDownloadDossier = () => {
    const csv = exportTaxisToCSV([taxi], db.drivers, db.owners);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-${taxi.plate.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !docExpiry.trim()) {
      setDocError('Ce champ est obligatoire.');
      return;
    }
    setDocError('');
    setLoading(true);
    try {
      await onAddDocument({
        taxiId: taxi.id,
        type: docType,
        label: DOCUMENT_TYPE_LABELS[docType],
        documentNumber: docNumber.trim(),
        issueDate: docIssue,
        expiryDate: docExpiry,
        fileName: docFile?.fileName || `${docType.toLowerCase()}_${taxi.plate.replace(/\s+/g, '')}.pdf`,
        fileSize: docFile?.fileSize || '340 Ko',
        verified: true,
      });
      setDocModalOpen(false);
      setDocNumber('');
      setDocFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infType.trim() || !infDesc.trim()) {
      setInfError('Ce champ est obligatoire.');
      return;
    }
    setInfError('');
    setLoading(true);
    try {
      await onAddInfraction({
        taxiId: taxi.id,
        driverId: taxi.driverId,
        date: '2026-11-25',
        type: infType.trim(),
        description: infDesc.trim(),
        severity: infSeverity,
        status: 'OUVERTE',
        zone: infZone.trim() || taxi.zone,
      });
      setInfractionModalOpen(false);
      setInfType('');
      setInfDesc('');
    } finally {
      setLoading(false);
    }
  };

  const tabs: Array<{ id: DetailTab; label: string; count?: number }> = [
    { id: 'informations', label: 'Informations' },
    { id: 'documents', label: 'Documents', count: taxiDocs.length },
    { id: 'infractions', label: 'Infractions', count: taxiInfractions.length },
    { id: 'historique', label: 'Historique', count: taxiHistory.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={onBack}
            className="no-print"
          >
            Retour
          </Button>
          <div className="h-6 w-px bg-[#DCE4EF] hidden sm:block no-print" />
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[20px] md:text-[22px] font-bold text-[#172B4D]">
              Taxi <span className="plate-badge">{taxi.plate}</span>
            </h2>
            <TaxiStatusBadge status={taxi.status} />
          </div>
          <span className="text-[13px] text-[#52627A]">
            {taxi.taxiNumber} · {taxi.brand} {taxi.model} · {taxi.zone}
          </span>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0 no-print">
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit3 className="h-4 w-4" />}
            onClick={() => onEditTaxi(taxi)}
          >
            Modifier
          </Button>
          {taxi.status !== 'SUSPENDU' ? (
            <Button
              variant="danger"
              size="sm"
              icon={<Ban className="h-4 w-4" />}
              onClick={() => setSuspendDialogOpen(true)}
            >
              Suspendre
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => onChangeStatus(taxi.id, 'AUTORISE', 'Réactivation depuis fiche taxi')}
            >
              Réactiver
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={handleDownloadDossier}
          >
            Télécharger
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#DCE4EF] flex items-center gap-1 overflow-x-auto no-print" role="tablist">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-[#174EA6] text-[#174EA6]'
                  : 'border-transparent text-[#52627A] hover:text-[#172B4D]'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-2 text-[12px] text-[#52627A] tabular-nums">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Informations */}
      {activeTab === 'informations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identification */}
          <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCE4EF] pb-3">
              <Info className="h-4 w-4 text-[#174EA6]" aria-hidden="true" />
              <h3 className="text-[16px] font-semibold text-[#172B4D]">Identification</h3>
            </div>
            <dl className="space-y-3 text-[14px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Immatriculation</dt>
                <dd className="plate-badge text-[#172B4D]">{taxi.plate}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Numéro de taxi</dt>
                <dd className="font-semibold text-[#172B4D] tabular-nums">{taxi.taxiNumber}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Marque</dt>
                <dd className="font-medium text-[#172B4D]">{taxi.brand}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Modèle</dt>
                <dd className="font-medium text-[#172B4D]">{taxi.model}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Couleur</dt>
                <dd className="font-medium text-[#172B4D]">{taxi.color}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Année</dt>
                <dd className="font-medium text-[#172B4D] tabular-nums">{taxi.year}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Zone</dt>
                <dd className="font-medium text-[#172B4D]">{taxi.zone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Autorisation</dt>
                <dd className="font-semibold text-[#123B72] tabular-nums">{taxi.authorizationNumber}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#52627A]">Validité</dt>
                <dd className="font-semibold text-[#172B4D] tabular-nums">{formatDateFR(taxi.validityDate)}</dd>
              </div>
            </dl>
            {taxi.notes && (
              <div className="rounded-[8px] bg-[#FFF3C4] p-3 text-[13px] text-[#52627A]">
                {taxi.notes}
              </div>
            )}
          </div>

          {/* Propriétaire */}
          <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#DCE4EF] pb-3">
              <Users className="h-4 w-4 text-[#174EA6]" aria-hidden="true" />
              <h3 className="text-[16px] font-semibold text-[#172B4D]">Propriétaire</h3>
            </div>
            {owner ? (
              <dl className="space-y-3 text-[14px]">
                <div>
                  <dt className="text-[12px] text-[#52627A]">Nom complet</dt>
                  <dd className="font-semibold text-[#172B4D]">{owner.fullName}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[#52627A]">Téléphone</dt>
                  <dd className="font-medium text-[#172B4D] tabular-nums">
                    {formatPhoneMG(owner.phone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[#52627A]">CIN</dt>
                  <dd className="font-medium text-[#172B4D] tabular-nums">{owner.cin}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[#52627A]">Adresse</dt>
                  <dd className="text-[#263B59]">{owner.address}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-[14px] text-[#52627A]">Aucun propriétaire associé.</p>
            )}
          </div>

          {/* Chauffeur & Statut rapide */}
          <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex items-center justify-between border-b border-[#DCE4EF] pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#174EA6]" aria-hidden="true" />
                <h3 className="text-[16px] font-semibold text-[#172B4D]">Chauffeur</h3>
              </div>
              {driver && <DriverStatusBadge status={driver.status} />}
            </div>
            {driver ? (
              <dl className="space-y-3 text-[14px]">
                <div>
                  <dt className="text-[12px] text-[#52627A]">Nom complet</dt>
                  <dd className="font-semibold text-[#172B4D]">{driver.fullName}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[#52627A]">Téléphone</dt>
                  <dd className="font-medium text-[#172B4D] tabular-nums">
                    {formatPhoneMG(driver.phone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[#52627A]">Permis de conduire</dt>
                  <dd className="font-medium text-[#172B4D] tabular-nums">
                    {driver.licenseNumber} (Cat. {driver.licenseCategory})
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[#52627A]">Validité permis</dt>
                  <dd className="text-[#263B59] tabular-nums">{formatDateFR(driver.licenseExpiry)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-[14px] text-[#52627A]">Aucun chauffeur assigné.</p>
            )}

            <div className="border-t border-[#DCE4EF] pt-4 no-print">
              <Select
                label="Changer le statut réglementaire"
                value={taxi.status}
                onChange={(e) =>
                  onChangeStatus(
                    taxi.id,
                    e.target.value as TaxiStatus,
                    'Mise à jour depuis la fiche détaillée'
                  )
                }
                options={[
                  { value: 'AUTORISE', label: 'Autorisé' },
                  { value: 'EN_VERIFICATION', label: 'En vérification' },
                  { value: 'SUSPENDU', label: 'Suspendu' },
                  { value: 'NON_AUTORISE', label: 'Non autorisé' },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[18px] font-semibold text-[#172B4D]">
              Pièces et documents réglementaires
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setDocModalOpen(true)}
            >
              Ajouter un document
            </Button>
          </div>

          {taxiDocs.length === 0 ? (
            <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-8 text-center text-[14px] text-[#52627A]">
              Aucun document enregistré pour ce véhicule.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taxiDocs.map((doc) => {
                const status = computeDocumentStatus(doc, db.settings.expiryWarningDays);
                return (
                  <div
                    key={doc.id}
                    className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#D8E7FF] text-[#174EA6]">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="text-[15px] font-semibold text-[#172B4D]">
                            {DOCUMENT_TYPE_LABELS[doc.type] || doc.label}
                          </h4>
                          <p className="text-[12px] text-[#52627A] tabular-nums">
                            {doc.documentNumber || 'Numéro non renseigné'}
                          </p>
                        </div>
                      </div>
                      <DocumentStatusBadge status={status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[13px] border-t border-[#DCE4EF] pt-3">
                      <div>
                        <span className="text-[#52627A]">Émission : </span>
                        <span className="font-medium text-[#172B4D] tabular-nums">
                          {formatDateFR(doc.issueDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#52627A]">Expiration : </span>
                        <span className="font-medium text-[#172B4D] tabular-nums">
                          {formatDateFR(doc.expiryDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#DCE4EF] pt-3">
                      <div className="flex items-center gap-2 text-[12px] text-[#52627A] min-w-0">
                        <span className="truncate">{doc.fileName || 'Aucun fichier'}</span>
                        <VerificationBadge state={doc.verified ? 'VERIFIED' : 'ATTENTION'} />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!doc.verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onVerifyDocument(doc.id, true)}
                          >
                            Valider
                          </Button>
                        )}
                        <IconButton
                          label={`Supprimer ${doc.label}`}
                          variant="danger"
                          onClick={() => setDeleteDocTarget(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Infractions */}
      {activeTab === 'infractions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[18px] font-semibold text-[#172B4D]">
              Infractions associées
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setInfractionModalOpen(true)}
            >
              Signaler une infraction
            </Button>
          </div>

          {taxiInfractions.length === 0 ? (
            <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] p-8 text-center text-[14px] text-[#52627A]">
              Aucune infraction enregistrée pour ce taxi.
            </div>
          ) : (
            <div className="space-y-3">
              {taxiInfractions.map((inf) => (
                <div
                  key={inf.id}
                  className="rounded-[12px] border border-[#DCE4EF] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                      <span className="text-[15px] font-semibold text-[#172B4D]">{inf.type}</span>
                      <InfractionSeverityBadge severity={inf.severity} />
                      <InfractionStatusBadge status={inf.status} />
                    </div>
                    <p className="text-[13px] text-[#52627A]">{inf.description}</p>
                    <p className="text-[12px] text-[#52627A] tabular-nums">
                      Le {formatDateFR(inf.date)} · Zone : {inf.zone} · Par {inf.agentName}
                    </p>
                  </div>
                  {inf.fineAmountAriary && (
                    <div className="text-right shrink-0">
                      <span className="text-[12px] text-[#52627A]">Amende</span>
                      <p className="text-[15px] font-bold text-[#172B4D] tabular-nums">
                        {inf.fineAmountAriary.toLocaleString('fr-FR')} Ar
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Historique timeline */}
      {activeTab === 'historique' && (
        <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 mb-5">
            <History className="h-5 w-5 text-[#174EA6]" aria-hidden="true" />
            <h3 className="text-[18px] font-semibold text-[#172B4D]">
              Historique des modifications et contrôles
            </h3>
          </div>

          {taxiHistory.length === 0 ? (
            <p className="text-[14px] text-[#52627A]">Aucun événement enregistré.</p>
          ) : (
            <ol className="relative border-l border-[#DCE4EF] ml-2.5 space-y-6">
              {taxiHistory.map((ev) => (
                <li key={ev.id} className="ml-5">
                  <span
                    className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[#174EA6] border-2 border-white"
                    aria-hidden="true"
                  />
                  <div className="text-[12px] font-semibold text-[#123B72] tabular-nums">
                    {formatDateTimeFR(ev.dateTime)}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold text-[#172B4D]">
                    {ev.action}
                  </div>
                  <p className="text-[13px] text-[#52627A]">{ev.details}</p>
                  <p className="mt-1 text-[12px] text-[#52627A]">par {ev.userName}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Suspend Confirmation */}
      <ConfirmDialog
        open={suspendDialogOpen}
        onClose={() => setSuspendDialogOpen(false)}
        title={`Suspendre le taxi ${taxi.plate} ?`}
        message="Cette action passe le taxi au statut Suspendu et consigne l'opération dans l'historique."
        confirmLabel="Suspendre"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          setLoading(true);
          try {
            await onChangeStatus(
              taxi.id,
              'SUSPENDU',
              suspendReason.trim() || 'Suspension administrative'
            );
            setSuspendDialogOpen(false);
            setSuspendReason('');
          } finally {
            setLoading(false);
          }
        }}
      >
        <Input
          label="Motif de suspension"
          placeholder="Ex. Assurance expirée, non-conformité..."
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
        />
      </ConfirmDialog>

      {/* Delete Document Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteDocTarget)}
        onClose={() => setDeleteDocTarget(null)}
        title="Supprimer ce document ?"
        message={`Voulez-vous vraiment supprimer le document "${deleteDocTarget?.label}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!deleteDocTarget) return;
          setLoading(true);
          try {
            await onDeleteDocument(deleteDocTarget.id);
            setDeleteDocTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* Add Document Modal */}
      <Modal
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Ajouter un document"
        description={`Dossier du taxi ${taxi.plate}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDocModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="add-doc-form" loading={loading}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="add-doc-form" onSubmit={handleSaveDocument} className="space-y-4">
          {docError && (
            <p className="text-[13px] font-medium text-[#DC2626]">{docError}</p>
          )}
          <Select
            label="Type de document"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            options={[
              { value: 'CARTE_GRISE', label: 'Carte grise' },
              { value: 'ASSURANCE', label: 'Assurance' },
              { value: 'LICENCE', label: 'Licence municipale' },
              { value: 'AUTORISATION', label: 'Autorisation de circuler' },
            ]}
          />
          <Input
            label="Numéro du document"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder="Ex. ASS-2026-9012"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date d’émission"
              type="date"
              value={docIssue}
              onChange={(e) => setDocIssue(e.target.value)}
              required
            />
            <Input
              label="Date d’expiration"
              type="date"
              value={docExpiry}
              onChange={(e) => setDocExpiry(e.target.value)}
              required
            />
          </div>
          <FileUploadZone
            file={docFile}
            onFileSelected={setDocFile}
            onRemove={() => setDocFile(null)}
          />
        </form>
      </Modal>

      {/* Add Infraction Modal */}
      <Modal
        open={infractionModalOpen}
        onClose={() => setInfractionModalOpen(false)}
        title="Signaler une infraction"
        description={`Taxi ${taxi.plate} · Chauffeur : ${driver?.fullName || 'Non assigné'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInfractionModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" type="submit" form="add-inf-form" loading={loading}>
              Enregistrer l’infraction
            </Button>
          </>
        }
      >
        <form id="add-inf-form" onSubmit={handleSaveInfraction} className="space-y-4">
          {infError && <p className="text-[13px] font-medium text-[#DC2626]">{infError}</p>}
          <Input
            label="Type d’infraction"
            value={infType}
            onChange={(e) => setInfType(e.target.value)}
            placeholder="Ex. Défaut d’assurance, Stationnement interdit..."
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gravité"
              value={infSeverity}
              onChange={(e) => setInfSeverity(e.target.value as InfractionSeverity)}
              options={[
                { value: 'FAIBLE', label: 'Faible' },
                { value: 'MOYENNE', label: 'Moyenne' },
                { value: 'GRAVE', label: 'Grave' },
                { value: 'TRES_GRAVE', label: 'Très grave' },
              ]}
            />
            <Input
              label="Zone"
              value={infZone || taxi.zone}
              onChange={(e) => setInfZone(e.target.value)}
            />
          </div>
          <Textarea
            label="Description"
            value={infDesc}
            onChange={(e) => setInfDesc(e.target.value)}
            placeholder="Circonstances constatées lors du contrôle..."
            required
          />
        </form>
      </Modal>
    </div>
  );
};
