import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDocumentStatus,
  computeDashboardMetrics,
  exportTaxisToCSV,
  filterTaxis,
  formatDateFR,
  formatDateTimeFR,
  formatPhoneMG,
  normalizePlate,
  scanDocumentMatch,
  validateTaxiForm,
} from './taxiLogic';
import type { AppDatabase } from '../types/taxi';

const mockDb: AppDatabase = {
  taxis: [
    {
      id: 't1',
      plate: '1234 TBA',
      taxiNumber: 'CUA-0101',
      brand: 'Renault',
      model: 'R4',
      color: 'Crème',
      year: 1991,
      zone: 'Analakely',
      ownerId: 'o1',
      driverId: 'd1',
      status: 'AUTORISE',
      authorizationNumber: 'AUT-2026-0101',
      validityDate: '2027-06-30',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-11-20T09:30:00Z',
    },
    {
      id: 't2',
      plate: '5678 TBB',
      taxiNumber: 'CUA-0202',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'Crème',
      year: 2004,
      zone: 'Ankorondrano',
      ownerId: 'o1',
      driverId: 'd2',
      status: 'SUSPENDU',
      authorizationNumber: 'AUT-2026-0202',
      validityDate: '2026-10-01',
      createdAt: '2026-02-12T10:00:00Z',
      updatedAt: '2026-11-18T14:00:00Z',
    },
  ],
  drivers: [
    {
      id: 'd1',
      fullName: 'Jean Rakoto',
      phone: '0341234567',
      licenseNumber: 'PC-102938-T',
      licenseCategory: 'B',
      licenseExpiry: '2028-05-01',
      address: 'Lot II M 45 Analakely',
      status: 'ACTIF',
      createdAt: '2026-01-01',
    },
    {
      id: 'd2',
      fullName: 'Paul Rasolofo',
      phone: '0329876543',
      licenseNumber: 'PC-998877-T',
      licenseCategory: 'B',
      licenseExpiry: '2026-12-05',
      address: 'Ankorondrano Est',
      status: 'SUSPENDU',
      createdAt: '2026-01-05',
    },
  ],
  owners: [
    {
      id: 'o1',
      fullName: 'Hery Andriamanantsoa',
      phone: '0331122334',
      address: 'Faravohitra, Antananarivo',
      cin: '101 234 567 890',
      createdAt: '2026-01-01',
    },
  ],
  documents: [
    {
      id: 'doc1',
      taxiId: 't1',
      type: 'ASSURANCE',
      label: 'Assurance',
      documentNumber: 'ASS-88412',
      issueDate: '2025-12-10',
      expiryDate: '2026-12-10',
      fileName: 'assurance_1234tba.pdf',
      fileSize: '420 Ko',
      verified: true,
      updatedAt: '2026-11-18',
    },
    {
      id: 'doc2',
      taxiId: 't2',
      type: 'LICENCE',
      label: 'Licence municipale',
      documentNumber: 'LIC-0202',
      issueDate: '2025-10-01',
      expiryDate: '2026-10-01',
      fileName: 'licence_5678tbb.pdf',
      fileSize: '310 Ko',
      verified: true,
      updatedAt: '2026-10-05',
    },
    {
      id: 'doc3',
      taxiId: 't2',
      type: 'CARTE_GRISE',
      label: 'Carte grise',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      verified: false,
      updatedAt: '2026-10-05',
    },
  ],
  licences: [],
  infractions: [
    {
      id: 'inf1',
      taxiId: 't2',
      driverId: 'd2',
      date: '2026-11-15',
      type: 'Licence expirée',
      description: 'Circulation avec licence communale expirée.',
      severity: 'GRAVE',
      status: 'OUVERTE',
      zone: 'Ankorondrano',
      agentName: 'Agent 01',
    },
  ],
  controls: [
    {
      id: 'c1',
      taxiId: 't1',
      dateTime: '2026-11-20T09:30:00Z',
      zone: 'Analakely',
      agentName: 'Agent 01',
      result: 'CONFORME',
      notes: 'Documents en règle',
      method: 'SCAN',
    },
  ],
  history: [],
  users: [],
  notifications: [],
  settings: {
    municipalityName: 'Commune Urbaine d’Antananarivo',
    departmentName: 'Direction des Transports Urbains',
    expiryWarningDays: 30,
    defaultPageSize: 10,
    requireConfirmationForStatusChange: true,
    emailAlertsEnabled: true,
    autoFlagExpiredDocuments: true,
    sessionTimeoutMinutes: 60,
  },
};

test('formatting helpers produce exact FR/MG formats', () => {
  assert.equal(formatDateFR('2026-11-20'), '20/11/2026');
  assert.equal(formatDateTimeFR('2026-11-20T09:30:00Z'), '20/11/2026 à 09:30');
  assert.equal(formatPhoneMG('0341234567'), '034 12 345 67');
  assert.equal(normalizePlate('  1234   tba '), '1234 TBA');
});

test('computeDocumentStatus handles valid, soon expiring, expired, and missing', () => {
  assert.equal(
    computeDocumentStatus({ documentNumber: 'A1', expiryDate: '2027-03-01', fileName: 'a.pdf' }, 30, '2026-11-25'),
    'VALIDE'
  );
  assert.equal(
    computeDocumentStatus({ documentNumber: 'A1', expiryDate: '2026-12-10', fileName: 'a.pdf' }, 30, '2026-11-25'),
    'BIENTOT_EXPIRE'
  );
  assert.equal(
    computeDocumentStatus({ documentNumber: 'A1', expiryDate: '2026-10-01', fileName: 'a.pdf' }, 30, '2026-11-25'),
    'EXPIRE'
  );
  assert.equal(
    computeDocumentStatus({ documentNumber: '', expiryDate: '', fileName: '' }, 30, '2026-11-25'),
    'MANQUANT'
  );
});

test('filterTaxis filters by query, status, zone, and document health', () => {
  const byPlate = filterTaxis(mockDb.taxis, mockDb.drivers, mockDb.owners, mockDb.documents, { query: '1234 TBA' });
  assert.equal(byPlate.length, 1);
  assert.equal(byPlate[0].id, 't1');

  const byDriver = filterTaxis(mockDb.taxis, mockDb.drivers, mockDb.owners, mockDb.documents, { query: 'Paul' });
  assert.equal(byDriver.length, 1);
  assert.equal(byDriver[0].id, 't2');

  const suspended = filterTaxis(mockDb.taxis, mockDb.drivers, mockDb.owners, mockDb.documents, { status: 'SUSPENDU' });
  assert.equal(suspended.length, 1);

  const soonExpiring = filterTaxis(mockDb.taxis, mockDb.drivers, mockDb.owners, mockDb.documents, { docHealth: 'BIENTOT_EXPIRE' });
  assert.equal(soonExpiring.length, 1);
  assert.equal(soonExpiring[0].id, 't1');
});

test('validateTaxiForm catches missing required fields and invalid plate', () => {
  const errors = validateTaxiForm({
    plate: '',
    taxiNumber: '',
    brand: 'Renault',
    model: 'R4',
    color: 'Crème',
    year: 1995,
    zone: 'Analakely',
    authorizationNumber: '',
    validityDate: '',
  });
  assert.equal(errors.plate, 'Ce champ est obligatoire.');
  assert.equal(errors.taxiNumber, 'Ce champ est obligatoire.');
  assert.equal(errors.ownerId, 'Ce champ est obligatoire.');
  assert.equal(errors.driverId, 'Ce champ est obligatoire.');
});

test('computeDashboardMetrics aggregates counts and expiring alerts accurately', () => {
  const metrics = computeDashboardMetrics(mockDb, '2026-11-25');
  assert.equal(metrics.totalTaxis, 2);
  assert.equal(metrics.authorizedCount, 1);
  assert.equal(metrics.suspendedCount, 1);
  assert.equal(metrics.expiredDocsCount, 2); // doc2 expired + doc3 missing
  assert.equal(metrics.soonExpiringDocsCount, 1); // doc1 in 15 days
  assert.equal(metrics.openInfractionsCount, 1);
  assert.equal(metrics.expiringAlerts.length, 3);
});

test('scanDocumentMatch identifies valid plate and rejects unknown plate', () => {
  const found = scanDocumentMatch('1234tba', mockDb, '2026-11-25');
  assert.equal(found.matched, true);
  assert.equal(found.message, 'Document identifié.');
  assert.equal(found.taxi?.plate, '1234 TBA');
  assert.equal(found.complianceSummary, 'ATTENTION'); // doc1 expires in 15 days

  const unknown = scanDocumentMatch('9999 ZZZ', mockDb, '2026-11-25');
  assert.equal(unknown.matched, false);
  assert.equal(unknown.message, 'Document non reconnu.');
});

test('exportTaxisToCSV generates valid semicolon CSV with BOM', () => {
  const csv = exportTaxisToCSV(mockDb.taxis, mockDb.drivers, mockDb.owners);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('1234 TBA'));
  assert.ok(csv.includes('Jean Rakoto'));
});
