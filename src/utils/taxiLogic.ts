import type {
  AppDatabase,
  DocumentStatus,
  DocumentType,
  Driver,
  Infraction,
  InfractionSeverity,
  LicenceAuthorization,
  LicenceStatus,
  Owner,
  Taxi,
  TaxiDocument,
  TaxiStatus,
} from '../types/taxi';

export const REFERENCE_TODAY = '2026-11-25';

export function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function formatPhoneMG(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('03')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)}`;
  }
  return raw.trim();
}

export function formatDateFR(isoDate: string | undefined | null): string {
  if (!isoDate) return '—';
  const datePart = isoDate.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

export function formatDateTimeFR(isoDateTime: string | undefined | null): string {
  if (!isoDateTime) return '—';
  const [datePart, timePart] = isoDateTime.split('T');
  const formattedDate = formatDateFR(datePart);
  if (!timePart) return formattedDate;
  const hhmm = timePart.slice(0, 5);
  return `${formattedDate} à ${hhmm}`;
}

export function daysUntilDate(isoDate: string, referenceDateStr: string = REFERENCE_TODAY): number {
  const target = new Date(`${isoDate.split('T')[0]}T00:00:00Z`).getTime();
  const ref = new Date(`${referenceDateStr.split('T')[0]}T00:00:00Z`).getTime();
  if (Number.isNaN(target) || Number.isNaN(ref)) return 0;
  return Math.round((target - ref) / (1000 * 60 * 60 * 24));
}

export function computeDocumentStatus(
  doc: Pick<TaxiDocument, 'expiryDate' | 'documentNumber' | 'fileName'>,
  warningDays: number = 30,
  referenceDateStr: string = REFERENCE_TODAY
): DocumentStatus {
  if (!doc.documentNumber?.trim() && !doc.fileName?.trim()) {
    return 'MANQUANT';
  }
  if (!doc.expiryDate) {
    return 'MANQUANT';
  }
  const diff = daysUntilDate(doc.expiryDate, referenceDateStr);
  if (diff < 0) return 'EXPIRE';
  if (diff <= warningDays) return 'BIENTOT_EXPIRE';
  return 'VALIDE';
}

export function computeLicenceStatus(
  licence: Pick<LicenceAuthorization, 'expiryDate' | 'status'>,
  warningDays: number = 30,
  referenceDateStr: string = REFERENCE_TODAY
): LicenceStatus {
  if (licence.status === 'REVOQUEE') return 'REVOQUEE';
  const diff = daysUntilDate(licence.expiryDate, referenceDateStr);
  if (diff < 0) return 'EXPIREE';
  if (diff <= warningDays) return 'BIENTOT_EXPIREE';
  return 'ACTIVE';
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CARTE_GRISE: 'Carte grise',
  ASSURANCE: 'Assurance',
  LICENCE: 'Licence municipale',
  AUTORISATION: 'Autorisation de circuler',
};

export const TAXI_STATUS_LABELS: Record<TaxiStatus, string> = {
  AUTORISE: 'Autorisé',
  NON_AUTORISE: 'Non autorisé',
  SUSPENDU: 'Suspendu',
  EN_VERIFICATION: 'En vérification',
};

export const SEVERITY_LABELS: Record<InfractionSeverity, string> = {
  FAIBLE: 'Faible',
  MOYENNE: 'Moyenne',
  GRAVE: 'Grave',
  TRES_GRAVE: 'Très grave',
};

export interface TaxiFilterCriteria {
  query?: string;
  status?: TaxiStatus | 'ALL';
  zone?: string | 'ALL';
  docHealth?: 'ALL' | 'EXPIRE' | 'BIENTOT_EXPIRE' | 'VALIDE';
  driverId?: string;
  ownerId?: string;
}

export function filterTaxis(
  taxis: Taxi[],
  drivers: Driver[],
  owners: Owner[],
  documents: TaxiDocument[],
  criteria: TaxiFilterCriteria,
  warningDays: number = 30,
  referenceDateStr: string = REFERENCE_TODAY
): Taxi[] {
  const q = (criteria.query || '').trim().toLowerCase();
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  return taxis.filter((taxi) => {
    if (criteria.status && criteria.status !== 'ALL' && taxi.status !== criteria.status) {
      return false;
    }
    if (criteria.zone && criteria.zone !== 'ALL' && taxi.zone !== criteria.zone) {
      return false;
    }
    if (criteria.driverId && taxi.driverId !== criteria.driverId) {
      return false;
    }
    if (criteria.ownerId && taxi.ownerId !== criteria.ownerId) {
      return false;
    }

    if (criteria.docHealth && criteria.docHealth !== 'ALL') {
      const taxiDocs = documents.filter((d) => d.taxiId === taxi.id);
      const statuses = taxiDocs.map((d) => computeDocumentStatus(d, warningDays, referenceDateStr));
      if (criteria.docHealth === 'EXPIRE' && !statuses.includes('EXPIRE') && !statuses.includes('MANQUANT')) {
        return false;
      }
      if (criteria.docHealth === 'BIENTOT_EXPIRE' && !statuses.includes('BIENTOT_EXPIRE')) {
        return false;
      }
      if (
        criteria.docHealth === 'VALIDE' &&
        (statuses.length === 0 || statuses.some((s) => s !== 'VALIDE'))
      ) {
        return false;
      }
    }

    if (q) {
      const driver = driverMap.get(taxi.driverId);
      const owner = ownerMap.get(taxi.ownerId);
      const haystack = [
        taxi.plate,
        taxi.taxiNumber,
        taxi.brand,
        taxi.model,
        taxi.zone,
        taxi.authorizationNumber,
        driver?.fullName || '',
        driver?.phone || '',
        owner?.fullName || '',
        owner?.phone || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export interface TaxiFormInput {
  plate: string;
  taxiNumber: string;
  brand: string;
  model: string;
  color: string;
  year: number | string;
  zone: string;
  authorizationNumber: string;
  validityDate: string;
  ownerId?: string;
  newOwnerName?: string;
  newOwnerPhone?: string;
  newOwnerAddress?: string;
  driverId?: string;
  newDriverName?: string;
  newDriverPhone?: string;
  newDriverLicense?: string;
}

export function validateTaxiForm(input: TaxiFormInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.plate.trim()) errors.plate = 'Ce champ est obligatoire.';
  else if (!/^[0-9]{1,4}\s?[A-Z]{2,3}$/i.test(input.plate.trim())) {
    errors.plate = 'Format attendu : ex. 1234 TBA.';
  }

  if (!input.taxiNumber.trim()) errors.taxiNumber = 'Ce champ est obligatoire.';
  if (!input.brand.trim()) errors.brand = 'Ce champ est obligatoire.';
  if (!input.model.trim()) errors.model = 'Ce champ est obligatoire.';
  if (!input.color.trim()) errors.color = 'Ce champ est obligatoire.';
  if (!input.zone.trim()) errors.zone = 'Ce champ est obligatoire.';
  if (!input.authorizationNumber.trim()) errors.authorizationNumber = 'Ce champ est obligatoire.';
  if (!input.validityDate.trim()) errors.validityDate = 'Ce champ est obligatoire.';

  const yearNum = Number(input.year);
  if (!input.year || Number.isNaN(yearNum) || yearNum < 1975 || yearNum > 2028) {
    errors.year = 'Année invalide (1975–2028).';
  }

  if (!input.ownerId && !input.newOwnerName?.trim()) {
    errors.ownerId = 'Ce champ est obligatoire.';
  }
  if (!input.ownerId && input.newOwnerName?.trim() && !input.newOwnerPhone?.trim()) {
    errors.newOwnerPhone = 'Ce champ est obligatoire.';
  }

  if (!input.driverId && !input.newDriverName?.trim()) {
    errors.driverId = 'Ce champ est obligatoire.';
  }
  if (!input.driverId && input.newDriverName?.trim() && !input.newDriverPhone?.trim()) {
    errors.newDriverPhone = 'Ce champ est obligatoire.';
  }

  return errors;
}

export interface DashboardMetrics {
  totalTaxis: number;
  authorizedCount: number;
  unauthorizedCount: number;
  suspendedCount: number;
  verificationCount: number;
  expiredDocsCount: number;
  soonExpiringDocsCount: number;
  openInfractionsCount: number;
  totalInfractionsCount: number;
  driversCount: number;
  ownersCount: number;
  statusBreakdown: { status: TaxiStatus; label: string; count: number; color: string }[];
  expiringAlerts: Array<{
    doc: TaxiDocument;
    taxi: Taxi;
    status: DocumentStatus;
    daysRemaining: number;
  }>;
  monthlyControlsTrend: Array<{
    month: string;
    controls: number;
    infractions: number;
  }>;
}

export function computeDashboardMetrics(
  db: AppDatabase,
  referenceDateStr: string = REFERENCE_TODAY
): DashboardMetrics {
  const warningDays = db.settings.expiryWarningDays || 30;
  const totalTaxis = db.taxis.length;
  const authorizedCount = db.taxis.filter((t) => t.status === 'AUTORISE').length;
  const unauthorizedCount = db.taxis.filter((t) => t.status === 'NON_AUTORISE').length;
  const suspendedCount = db.taxis.filter((t) => t.status === 'SUSPENDU').length;
  const verificationCount = db.taxis.filter((t) => t.status === 'EN_VERIFICATION').length;

  const taxiMap = new Map(db.taxis.map((t) => [t.id, t]));
  let expiredDocsCount = 0;
  let soonExpiringDocsCount = 0;

  const expiringAlerts: DashboardMetrics['expiringAlerts'] = [];

  for (const doc of db.documents) {
    const status = computeDocumentStatus(doc, warningDays, referenceDateStr);
    if (status === 'EXPIRE' || status === 'MANQUANT') {
      expiredDocsCount += 1;
    } else if (status === 'BIENTOT_EXPIRE') {
      soonExpiringDocsCount += 1;
    }

    if (status === 'EXPIRE' || status === 'BIENTOT_EXPIRE' || status === 'MANQUANT') {
      const taxi = taxiMap.get(doc.taxiId);
      if (taxi) {
        expiringAlerts.push({
          doc,
          taxi,
          status,
          daysRemaining: doc.expiryDate ? daysUntilDate(doc.expiryDate, referenceDateStr) : -999,
        });
      }
    }
  }

  expiringAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const openInfractionsCount = db.infractions.filter(
    (inf) => inf.status === 'OUVERTE' || inf.status === 'EN_COURS'
  ).length;

  const statusBreakdown = [
    { status: 'AUTORISE' as TaxiStatus, label: 'Autorisé', count: authorizedCount, color: '#16A34A' },
    { status: 'EN_VERIFICATION' as TaxiStatus, label: 'En vérification', count: verificationCount, color: '#174EA6' },
    { status: 'SUSPENDU' as TaxiStatus, label: 'Suspendu', count: suspendedCount, color: '#D97706' },
    { status: 'NON_AUTORISE' as TaxiStatus, label: 'Non autorisé', count: unauthorizedCount, color: '#DC2626' },
  ];

  // Aggregate controls & infractions over last 6 months (Juil - Nov 2026)
  const months = [
    { key: '2026-07', label: 'Juil' },
    { key: '2026-08', label: 'Août' },
    { key: '2026-09', label: 'Sept' },
    { key: '2026-10', label: 'Oct' },
    { key: '2026-11', label: 'Nov' },
  ];

  const monthlyControlsTrend = months.map((m) => {
    const controls = db.controls.filter((c) => c.dateTime.startsWith(m.key)).length;
    const infractions = db.infractions.filter((i) => i.date.startsWith(m.key)).length;
    return {
      month: m.label,
      controls,
      infractions,
    };
  });

  return {
    totalTaxis,
    authorizedCount,
    unauthorizedCount,
    suspendedCount,
    verificationCount,
    expiredDocsCount,
    soonExpiringDocsCount,
    openInfractionsCount,
    totalInfractionsCount: db.infractions.length,
    driversCount: db.drivers.length,
    ownersCount: db.owners.length,
    statusBreakdown,
    expiringAlerts,
    monthlyControlsTrend,
  };
}

export interface ScanResult {
  matched: boolean;
  query: string;
  taxi?: Taxi;
  driver?: Driver;
  owner?: Owner;
  documents: Array<TaxiDocument & { computedStatus: DocumentStatus }>;
  openInfractions: Infraction[];
  complianceSummary: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME' | 'INCONNU';
  message: string;
}

export function scanDocumentMatch(
  rawQuery: string,
  db: AppDatabase,
  referenceDateStr: string = REFERENCE_TODAY
): ScanResult {
  const query = rawQuery.trim();
  const normalized = query.toUpperCase().replace(/\s+/g, '');

  if (!normalized) {
    return {
      matched: false,
      query,
      documents: [],
      openInfractions: [],
      complianceSummary: 'INCONNU',
      message: 'Document non reconnu.',
    };
  }

  let matchedTaxi = db.taxis.find(
    (t) =>
      t.plate.toUpperCase().replace(/\s+/g, '') === normalized ||
      t.taxiNumber.toUpperCase().replace(/\s+/g, '') === normalized ||
      t.authorizationNumber.toUpperCase().replace(/\s+/g, '') === normalized
  );

  if (!matchedTaxi) {
    const matchedDoc = db.documents.find(
      (d) => d.documentNumber.toUpperCase().replace(/\s+/g, '') === normalized
    );
    if (matchedDoc) {
      matchedTaxi = db.taxis.find((t) => t.id === matchedDoc.taxiId);
    }
  }

  if (!matchedTaxi) {
    const matchedLicence = db.licences.find(
      (l) =>
        l.licenceNumber.toUpperCase().replace(/\s+/g, '') === normalized ||
        l.authorizationNumber.toUpperCase().replace(/\s+/g, '') === normalized
    );
    if (matchedLicence) {
      matchedTaxi = db.taxis.find((t) => t.id === matchedLicence.taxiId);
    }
  }

  if (!matchedTaxi) {
    return {
      matched: false,
      query,
      documents: [],
      openInfractions: [],
      complianceSummary: 'INCONNU',
      message: 'Document non reconnu.',
    };
  }

  const warningDays = db.settings.expiryWarningDays || 30;
  const driver = db.drivers.find((d) => d.id === matchedTaxi!.driverId);
  const owner = db.owners.find((o) => o.id === matchedTaxi!.ownerId);
  const documents = db.documents
    .filter((d) => d.taxiId === matchedTaxi!.id)
    .map((d) => ({
      ...d,
      computedStatus: computeDocumentStatus(d, warningDays, referenceDateStr),
    }));
  const openInfractions = db.infractions.filter(
    (i) => i.taxiId === matchedTaxi!.id && (i.status === 'OUVERTE' || i.status === 'EN_COURS')
  );

  const hasExpired = documents.some((d) => d.computedStatus === 'EXPIRE' || d.computedStatus === 'MANQUANT');
  const hasSoon = documents.some((d) => d.computedStatus === 'BIENTOT_EXPIRE');

  let complianceSummary: ScanResult['complianceSummary'] = 'CONFORME';
  if (matchedTaxi.status === 'NON_AUTORISE' || matchedTaxi.status === 'SUSPENDU' || hasExpired) {
    complianceSummary = 'NON_CONFORME';
  } else if (matchedTaxi.status === 'EN_VERIFICATION' || hasSoon || openInfractions.length > 0) {
    complianceSummary = 'ATTENTION';
  }

  return {
    matched: true,
    query,
    taxi: matchedTaxi,
    driver,
    owner,
    documents,
    openInfractions,
    complianceSummary,
    message: 'Document identifié.',
  };
}

function escapeCsvCell(value: string | number | undefined | null): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTaxisToCSV(
  taxis: Taxi[],
  drivers: Driver[],
  owners: Owner[]
): string {
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const headers = [
    'N° Taxi',
    'Immatriculation',
    'Marque',
    'Modèle',
    'Année',
    'Zone',
    'Chauffeur',
    'Téléphone Chauffeur',
    'Propriétaire',
    'Statut',
    'Autorisation',
    'Validité',
  ];
  const rows = taxis.map((t) => {
    const d = driverMap.get(t.driverId);
    const o = ownerMap.get(t.ownerId);
    return [
      t.taxiNumber,
      t.plate,
      t.brand,
      t.model,
      t.year,
      t.zone,
      d?.fullName || 'Non assigné',
      d?.phone || '',
      o?.fullName || 'Non renseigné',
      TAXI_STATUS_LABELS[t.status],
      t.authorizationNumber,
      formatDateFR(t.validityDate),
    ]
      .map(escapeCsvCell)
      .join(';');
  });
  return '\uFEFF' + [headers.join(';'), ...rows].join('\n');
}

export function exportInfractionsToCSV(
  infractions: Infraction[],
  taxis: Taxi[],
  drivers: Driver[]
): string {
  const taxiMap = new Map(taxis.map((t) => [t.id, t]));
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const headers = [
    'Date',
    'Immatriculation',
    'Chauffeur',
    'Type',
    'Gravité',
    'Statut',
    'Zone',
    'Agent',
    'Description',
  ];
  const rows = infractions.map((inf) => {
    const t = taxiMap.get(inf.taxiId);
    const d = driverMap.get(inf.driverId);
    return [
      formatDateFR(inf.date),
      t?.plate || '—',
      d?.fullName || '—',
      inf.type,
      SEVERITY_LABELS[inf.severity],
      inf.status,
      inf.zone,
      inf.agentName,
      inf.description,
    ]
      .map(escapeCsvCell)
      .join(';');
  });
  return '\uFEFF' + [headers.join(';'), ...rows].join('\n');
}
