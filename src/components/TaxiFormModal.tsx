import React, { useEffect, useState } from 'react';
import type { Driver, Owner, Taxi, TaxiDocument, TaxiStatus } from '../types/taxi';
import { ANTANANARIVO_ZONES } from '../data/seedData';
import { validateTaxiForm } from '../utils/taxiLogic';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Select, Textarea } from './ui/FormControls';
import { FileUploadZone, type UploadedFileMeta } from './ui/FileUploadZone';

interface TaxiFormModalProps {
  open: boolean;
  onClose: () => void;
  drivers: Driver[];
  owners: Owner[];
  editingTaxi?: Taxi | null;
  onSubmit: (payload: {
    taxi: Partial<Taxi>;
    newOwner?: Partial<Owner>;
    newDriver?: Partial<Driver>;
    documents?: Array<Partial<TaxiDocument>>;
  }) => Promise<void>;
}

export const TaxiFormModal: React.FC<TaxiFormModalProps> = ({
  open,
  onClose,
  drivers,
  owners,
  editingTaxi,
  onSubmit,
}) => {
  const [plate, setPlate] = useState('');
  const [taxiNumber, setTaxiNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('Crème');
  const [year, setYear] = useState('2005');
  const [zone, setZone] = useState('Analakely');
  const [status, setStatus] = useState<TaxiStatus>('AUTORISE');
  const [authorizationNumber, setAuthorizationNumber] = useState('');
  const [validityDate, setValidityDate] = useState('2027-12-31');
  const [notes, setNotes] = useState('');

  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('existing');
  const [ownerId, setOwnerId] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');

  const [driverMode, setDriverMode] = useState<'existing' | 'new'>('existing');
  const [driverId, setDriverId] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverLicense, setNewDriverLicense] = useState('');

  const [carteGriseFile, setCarteGriseFile] = useState<UploadedFileMeta | null>(null);
  const [assuranceFile, setAssuranceFile] = useState<UploadedFileMeta | null>(null);
  const [assuranceExpiry, setAssuranceExpiry] = useState('2027-11-25');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError('');
    if (editingTaxi) {
      setPlate(editingTaxi.plate);
      setTaxiNumber(editingTaxi.taxiNumber);
      setBrand(editingTaxi.brand);
      setModel(editingTaxi.model);
      setColor(editingTaxi.color);
      setYear(String(editingTaxi.year));
      setZone(editingTaxi.zone);
      setStatus(editingTaxi.status);
      setAuthorizationNumber(editingTaxi.authorizationNumber);
      setValidityDate(editingTaxi.validityDate);
      setNotes(editingTaxi.notes || '');
      setOwnerMode('existing');
      setOwnerId(editingTaxi.ownerId);
      setDriverMode('existing');
      setDriverId(editingTaxi.driverId);
    } else {
      setPlate('');
      setTaxiNumber(`CUA-${Math.floor(1000 + Math.random() * 8999)}`);
      setBrand('');
      setModel('');
      setColor('Crème');
      setYear('2006');
      setZone('Analakely');
      setStatus('AUTORISE');
      setAuthorizationNumber(`AUT-2026-${Math.floor(1000 + Math.random() * 8999)}`);
      setValidityDate('2027-11-25');
      setNotes('');
      setOwnerMode(owners.length > 0 ? 'existing' : 'new');
      setOwnerId(owners[0]?.id || '');
      setNewOwnerName('');
      setNewOwnerPhone('');
      setNewOwnerAddress('');
      setDriverMode(drivers.length > 0 ? 'existing' : 'new');
      setDriverId(drivers[0]?.id || '');
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverLicense('');
      setCarteGriseFile(null);
      setAssuranceFile(null);
      setAssuranceExpiry('2027-11-25');
    }
  }, [open, editingTaxi, owners, drivers]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTaxiForm({
      plate,
      taxiNumber,
      brand,
      model,
      color,
      year,
      zone,
      authorizationNumber,
      validityDate,
      ownerId: ownerMode === 'existing' ? ownerId : undefined,
      newOwnerName: ownerMode === 'new' ? newOwnerName : undefined,
      newOwnerPhone: ownerMode === 'new' ? newOwnerPhone : undefined,
      newOwnerAddress: ownerMode === 'new' ? newOwnerAddress : undefined,
      driverId: driverMode === 'existing' ? driverId : undefined,
      newDriverName: driverMode === 'new' ? newDriverName : undefined,
      newDriverPhone: driverMode === 'new' ? newDriverPhone : undefined,
      newDriverLicense: driverMode === 'new' ? newDriverLicense : undefined,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      const documents: Array<Partial<TaxiDocument>> = [];
      if (!editingTaxi) {
        documents.push({
          type: 'CARTE_GRISE',
          label: 'Carte grise',
          documentNumber: `CG-${plate.trim().toUpperCase().replace(/\s+/g, '-')}`,
          issueDate: '2026-01-15',
          expiryDate: '2029-01-15',
          fileName: carteGriseFile?.fileName || 'carte_grise.pdf',
          fileSize: carteGriseFile?.fileSize || '450 Ko',
          verified: true,
        });
        documents.push({
          type: 'ASSURANCE',
          label: 'Assurance',
          documentNumber: `ASS-${Math.floor(10000 + Math.random() * 89999)}`,
          issueDate: '2026-11-25',
          expiryDate: assuranceExpiry,
          fileName: assuranceFile?.fileName || 'assurance.pdf',
          fileSize: assuranceFile?.fileSize || '390 Ko',
          verified: Boolean(assuranceFile),
        });
        documents.push({
          type: 'AUTORISATION',
          label: 'Autorisation de circuler',
          documentNumber: authorizationNumber.trim(),
          issueDate: '2026-11-25',
          expiryDate: validityDate,
          fileName: 'autorisation_cua.pdf',
          fileSize: '280 Ko',
          verified: true,
        });
      }

      await onSubmit({
        taxi: {
          plate: plate.trim(),
          taxiNumber: taxiNumber.trim(),
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim(),
          year: Number(year),
          zone,
          status,
          authorizationNumber: authorizationNumber.trim(),
          validityDate,
          notes: notes.trim(),
          ownerId: ownerMode === 'existing' ? ownerId : undefined,
          driverId: driverMode === 'existing' ? driverId : undefined,
        },
        newOwner:
          ownerMode === 'new'
            ? {
                fullName: newOwnerName.trim(),
                phone: newOwnerPhone.trim(),
                address: newOwnerAddress.trim() || 'Antananarivo',
              }
            : undefined,
        newDriver:
          driverMode === 'new'
            ? {
                fullName: newDriverName.trim(),
                phone: newDriverPhone.trim(),
                licenseNumber: newDriverLicense.trim() || 'PC-EN-COURS',
              }
            : undefined,
        documents,
      });
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Impossible d’enregistrer les modifications.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTaxi ? `Modifier le taxi ${editingTaxi.plate}` : 'Ajouter un taxi'}
      description="Renseignez les informations du véhicule, du propriétaire, du chauffeur et des pièces."
      maxWidthClass="max-w-[640px]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" form="taxi-form" loading={submitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="taxi-form" onSubmit={handleSave} className="space-y-6" noValidate>
        {serverError && (
          <div className="rounded-[8px] border border-[#FECACA] bg-[#FEE2E2] p-3 text-[13px] font-medium text-[#DC2626]">
            {serverError}
          </div>
        )}

        {/* Section 1 : Informations du taxi */}
        <div className="space-y-4">
          <div className="border-b border-[#DCE4EF] pb-2">
            <h3 className="text-[14px] font-bold text-[#123B72]">Informations du taxi</h3>
            <p className="text-[12px] text-[#52627A]">Identification administrative et véhicule</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Immatriculation"
              placeholder="1234 TBA"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              error={errors.plate}
              required
            />
            <Input
              label="Numéro de taxi CUA"
              placeholder="CUA-0115"
              value={taxiNumber}
              onChange={(e) => setTaxiNumber(e.target.value)}
              error={errors.taxiNumber}
              required
            />
            <Input
              label="Marque"
              placeholder="Renault, Toyota, Peugeot..."
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              error={errors.brand}
              required
            />
            <Input
              label="Modèle"
              placeholder="R4, Corolla, 205..."
              value={model}
              onChange={(e) => setModel(e.target.value)}
              error={errors.model}
              required
            />
            <Input
              label="Couleur"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              error={errors.color}
              required
            />
            <Input
              label="Année"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              error={errors.year}
              required
            />
            <Select
              label="Zone d’affectation"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              options={ANTANANARIVO_ZONES.map((z) => ({ value: z, label: z }))}
              required
            />
            <Select
              label="Statut réglementaire"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaxiStatus)}
              options={[
                { value: 'AUTORISE', label: 'Autorisé' },
                { value: 'EN_VERIFICATION', label: 'En vérification' },
                { value: 'SUSPENDU', label: 'Suspendu' },
                { value: 'NON_AUTORISE', label: 'Non autorisé' },
              ]}
              required
            />
            <Input
              label="N° d’autorisation"
              value={authorizationNumber}
              onChange={(e) => setAuthorizationNumber(e.target.value)}
              error={errors.authorizationNumber}
              required
            />
            <Input
              label="Date de validité"
              type="date"
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
              error={errors.validityDate}
              required
            />
          </div>
        </div>

        {/* Section 2 : Propriétaire */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE4EF] pb-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#123B72]">Propriétaire</h3>
            </div>
            <div className="inline-flex rounded-full border border-[#DCE4EF] bg-[#F7F9FC] p-0.5 text-[12px]">
              <button
                type="button"
                onClick={() => setOwnerMode('existing')}
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  ownerMode === 'existing' ? 'bg-white text-[#174EA6] shadow-sm' : 'text-[#52627A]'
                }`}
              >
                Existant
              </button>
              <button
                type="button"
                onClick={() => setOwnerMode('new')}
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  ownerMode === 'new' ? 'bg-white text-[#174EA6] shadow-sm' : 'text-[#52627A]'
                }`}
              >
                Nouveau
              </button>
            </div>
          </div>

          {ownerMode === 'existing' ? (
            <Select
              label="Sélectionner un propriétaire"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              error={errors.ownerId}
              options={owners.map((o) => ({
                value: o.id,
                label: `${o.fullName} (${o.phone})`,
              }))}
              required
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom du propriétaire"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                error={errors.ownerId}
                placeholder="Ex. Rajoelina Nirina"
                required
              />
              <Input
                label="Téléphone"
                value={newOwnerPhone}
                onChange={(e) => setNewOwnerPhone(e.target.value)}
                error={errors.newOwnerPhone}
                placeholder="034 XX XXX XX"
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Adresse"
                  value={newOwnerAddress}
                  onChange={(e) => setNewOwnerAddress(e.target.value)}
                  placeholder="Lot, quartier, Antananarivo"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3 : Chauffeur */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#DCE4EF] pb-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#123B72]">Chauffeur</h3>
            </div>
            <div className="inline-flex rounded-full border border-[#DCE4EF] bg-[#F7F9FC] p-0.5 text-[12px]">
              <button
                type="button"
                onClick={() => setDriverMode('existing')}
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  driverMode === 'existing' ? 'bg-white text-[#174EA6] shadow-sm' : 'text-[#52627A]'
                }`}
              >
                Existant
              </button>
              <button
                type="button"
                onClick={() => setDriverMode('new')}
                className={`rounded-full px-2.5 py-1 font-semibold ${
                  driverMode === 'new' ? 'bg-white text-[#174EA6] shadow-sm' : 'text-[#52627A]'
                }`}
              >
                Nouveau
              </button>
            </div>
          </div>

          {driverMode === 'existing' ? (
            <Select
              label="Sélectionner un chauffeur"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              error={errors.driverId}
              options={drivers.map((d) => ({
                value: d.id,
                label: `${d.fullName} — Permis ${d.licenseNumber}`,
              }))}
              required
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom du chauffeur"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                error={errors.driverId}
                placeholder="Ex. Rakotoarisoa Michel"
                required
              />
              <Input
                label="Téléphone"
                value={newDriverPhone}
                onChange={(e) => setNewDriverPhone(e.target.value)}
                error={errors.newDriverPhone}
                placeholder="034 XX XXX XX"
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Numéro de permis"
                  value={newDriverLicense}
                  onChange={(e) => setNewDriverLicense(e.target.value)}
                  placeholder="PC-XXXXXX-T"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4 : Documents (on create) */}
        {!editingTaxi && (
          <div className="space-y-4">
            <div className="border-b border-[#DCE4EF] pb-2">
              <h3 className="text-[14px] font-bold text-[#123B72]">Documents initiaux</h3>
              <p className="text-[12px] text-[#52627A]">
                Joignez la carte grise et l’attestation d’assurance (optionnel à la création)
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-[13px] font-semibold text-[#263B59]">Carte grise</span>
                <FileUploadZone
                  file={carteGriseFile}
                  onFileSelected={setCarteGriseFile}
                  onRemove={() => setCarteGriseFile(null)}
                />
              </div>
              <div className="space-y-1.5">
                <span className="block text-[13px] font-semibold text-[#263B59]">Assurance</span>
                <FileUploadZone
                  file={assuranceFile}
                  onFileSelected={setAssuranceFile}
                  onRemove={() => setAssuranceFile(null)}
                />
                <Input
                  label="Expiration assurance"
                  type="date"
                  value={assuranceExpiry}
                  onChange={(e) => setAssuranceExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <Textarea
          label="Observations"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes administratives ou remarques de contrôle..."
        />
      </form>
    </Modal>
  );
};
