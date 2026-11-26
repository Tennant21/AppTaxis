import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  ClipboardCheck,
  Loader2,
  QrCode,
  Search,
  XCircle,
} from 'lucide-react';
import type { AppDatabase, ControlInspection, Infraction } from '../types/taxi';
import { ANTANANARIVO_ZONES } from '../data/seedData';
import {
  DOCUMENT_TYPE_LABELS,
  formatDateFR,
  scanDocumentMatch,
  type ScanResult,
} from '../utils/taxiLogic';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormControls';
import { DocumentStatusBadge, TaxiStatusBadge } from '../components/ui/Badges';

interface ScannerViewProps {
  db: AppDatabase;
  onLogControl: (control: Partial<ControlInspection>) => Promise<void>;
  onCreateInfraction: (inf: Partial<Infraction>) => Promise<void>;
  onViewTaxi: (taxiId: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  db,
  onLogControl,
  onCreateInfraction,
  onViewTaxi,
}) => {
  const [scanInput, setScanInput] = useState('');
  const [zone, setZone] = useState('Analakely');
  const [phase, setPhase] = useState<'IDLE' | 'SCANNING' | 'RESULT'>('IDLE');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [savingControl, setSavingControl] = useState(false);

  const runScan = (value: string) => {
    const query = value.trim();
    if (!query) return;
    setScanInput(query);
    setPhase('SCANNING');
    setTimeout(() => {
      const res = scanDocumentMatch(query, db);
      setResult(res);
      setPhase('RESULT');
    }, 400);
  };

  const handleLogControl = async (outcome: ControlInspection['result']) => {
    if (!result?.taxi) return;
    setSavingControl(true);
    try {
      await onLogControl({
        taxiId: result.taxi.id,
        zone,
        result: outcome,
        method: 'SCAN',
        notes:
          outcome === 'CONFORME'
            ? 'Vérification par scan conforme.'
            : outcome === 'AVERTISSEMENT'
            ? 'Avertissement émis lors du scan terrain.'
            : 'Non-conformité détectée au scan.',
      });
      if (outcome === 'NON_CONFORME') {
        await onCreateInfraction({
          taxiId: result.taxi.id,
          driverId: result.taxi.driverId,
          date: '2026-11-25',
          type: 'Non-conformité détectée au contrôle scan',
          description: `Contrôle terrain non conforme dans la zone ${zone}.`,
          severity: 'GRAVE',
          status: 'OUVERTE',
          zone,
        });
      }
    } finally {
      setSavingControl(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-bold text-[#172B4D]">Scanner</h2>
        <p className="mt-1 text-[14px] text-[#52627A]">
          Vérification instantanée d’un document, QR d’autorisation ou plaque d’immatriculation sur le terrain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner Frame Card */}
        <div className="lg:col-span-6 rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-5">
          <div className="relative rounded-[12px] border-2 border-dashed border-[#174EA6]/40 bg-[#123B72] text-white p-8 flex flex-col items-center justify-center min-h-[260px] text-center">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 h-6 w-6 border-t-3 border-l-3 border-[#F4C542] rounded-tl" />
            <div className="absolute top-4 right-4 h-6 w-6 border-t-3 border-r-3 border-[#F4C542] rounded-tr" />
            <div className="absolute bottom-4 left-4 h-6 w-6 border-b-3 border-l-3 border-[#F4C542] rounded-bl" />
            <div className="absolute bottom-4 right-4 h-6 w-6 border-b-3 border-r-3 border-[#F4C542] rounded-br" />

            {phase === 'SCANNING' ? (
              <div className="space-y-3">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#F4C542]" aria-hidden="true" />
                <p className="text-[15px] font-semibold">Vérification en cours...</p>
                <p className="text-[13px] text-white/75">
                  Consultation de la base municipale CUA
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0A8]/10">
                  <Camera className="h-7 w-7 text-[#F4C542]" aria-hidden="true" />
                </div>
                <p className="text-[16px] font-semibold">Placez le document dans le cadre.</p>
                <p className="text-[13px] text-white/80 max-w-xs">
                  Scannez le QR code de la licence ou saisissez le numéro d’immatriculation / document ci-dessous.
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runScan(scanInput);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Immatriculation ou N° de document"
                placeholder="Ex. 1234 TBA ou AUT-2026-0101"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
              />
              <Select
                label="Zone du contrôle"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                options={ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z }))}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              icon={<Search className="h-4 w-4" />}
              disabled={!scanInput.trim() || phase === 'SCANNING'}
            >
              Vérifier le document
            </Button>
          </form>

          {/* Quick scan test samples */}
          <div className="border-t border-[#DCE4EF] pt-4">
            <p className="text-[12px] font-semibold text-[#52627A] mb-2.5">
              Simulations de scan rapide :
            </p>
            <div className="flex flex-wrap gap-2">
              {['1234 TBA', '5678 TBB', '3390 TBB', '4582 TBC', '9999 ZZZ'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => runScan(sample)}
                  className="plate-badge rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-3.5 py-1.5 text-[12px] text-[#172B4D] hover:border-[#174EA6] hover:bg-[#D8E7FF] transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="lg:col-span-6">
          {phase === 'IDLE' && (
            <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D8E7FF] text-[#174EA6]">
                <QrCode className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-[18px] font-semibold text-[#172B4D]">
                En attente de vérification
              </h3>
              <p className="mt-1.5 text-[14px] text-[#52627A]">
                Lancez un scan ou saisissez une plaque pour afficher la situation réglementaire du taxi.
              </p>
            </div>
          )}

          {phase === 'RESULT' && result && !result.matched && (
            <div className="rounded-[12px] border border-[#FECACA] bg-[#E4EEFF] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#DC2626]">{result.message}</h3>
                  <p className="text-[13px] text-[#52627A]">
                    Aucune correspondance trouvée pour « {result.query} » dans le registre CUA.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setPhase('IDLE');
                  setResult(null);
                  setScanInput('');
                }}
              >
                Nouveau scan
              </Button>
            </div>
          )}

          {phase === 'RESULT' && result && result.matched && result.taxi && (
            <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-[#DCE4EF] pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${
                      result.complianceSummary === 'CONFORME'
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : result.complianceSummary === 'ATTENTION'
                        ? 'bg-[#FEF3C7] text-[#D97706]'
                        : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}
                  >
                    {result.complianceSummary === 'CONFORME' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : result.complianceSummary === 'ATTENTION' ? (
                      <AlertTriangle className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#16A34A]">
                      {result.message}
                    </p>
                    <h3 className="text-[20px] font-bold text-[#172B4D]">
                      Taxi <span className="plate-badge">{result.taxi.plate}</span>
                    </h3>
                  </div>
                </div>
                <TaxiStatusBadge status={result.taxi.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span className="text-[#52627A]">Véhicule :</span>
                  <p className="font-semibold text-[#172B4D]">
                    {result.taxi.brand} {result.taxi.model}
                  </p>
                </div>
                <div>
                  <span className="text-[#52627A]">Chauffeur :</span>
                  <p className="font-semibold text-[#172B4D]">
                    {result.driver?.fullName || 'Non assigné'}
                  </p>
                </div>
                <div>
                  <span className="text-[#52627A]">Autorisation :</span>
                  <p className="font-semibold text-[#123B72] tabular-nums">
                    {result.taxi.authorizationNumber}
                  </p>
                </div>
                <div>
                  <span className="text-[#52627A]">Validité :</span>
                  <p className="font-semibold text-[#172B4D] tabular-nums">
                    {formatDateFR(result.taxi.validityDate)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#DCE4EF] pt-4">
                <h4 className="text-[13px] font-semibold text-[#172B4D]">
                  Vérification des documents ({result.documents.length})
                </h4>
                <div className="space-y-2">
                  {result.documents.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-[8px] bg-[#FFF3C4] px-3 py-2 text-[13px]"
                    >
                      <span className="font-medium text-[#263B59]">
                        {DOCUMENT_TYPE_LABELS[d.type] || d.label}
                      </span>
                      <DocumentStatusBadge status={d.computedStatus} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[#DCE4EF] pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  loading={savingControl}
                  icon={<ClipboardCheck className="h-4 w-4" />}
                  onClick={() => handleLogControl('CONFORME')}
                >
                  Valider
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={savingControl}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  onClick={() => handleLogControl('NON_CONFORME')}
                >
                  Non-conformité
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewTaxi(result.taxi!.id)}
                >
                  Fiche complète
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
