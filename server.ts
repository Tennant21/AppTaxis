import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createSeedDatabase } from './src/data/seedData';
import type {
  AppDatabase,
  AppSettings,
  ControlInspection,
  Driver,
  HistoryEvent,
  Infraction,
  LicenceAuthorization,
  Owner,
  Taxi,
  TaxiDocument,
  TaxiStatus,
  UserAccount,
} from './src/types/taxi';
import { normalizePlate } from './src/utils/taxiLogic';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cua-database.json');

function ensureDb(): AppDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as AppDatabase;
  } catch {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

let db: AppDatabase = ensureDb();

function saveDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addHistory(entry: Omit<HistoryEvent, 'id' | 'dateTime'> & { dateTime?: string }) {
  db.history.unshift({
    id: makeId('his'),
    dateTime: entry.dateTime || nowIso(),
    entityType: entry.entityType,
    entityId: entry.entityId,
    taxiId: entry.taxiId,
    action: entry.action,
    userName: entry.userName,
    details: entry.details,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Bootstrap full state
  app.get('/api/bootstrap', (_req, res) => {
    res.json(db);
  });

  // Reset demo data
  app.post('/api/reset-demo', (_req, res) => {
    db = createSeedDatabase();
    saveDb();
    res.json(db);
  });

  // Auth login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }
    if (user.status === 'DESACTIVE') {
      res.status(403).json({ error: 'Ce compte est désactivé. Contactez un administrateur.' });
      return;
    }
    if (user.password && password && user.password !== password) {
      res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
      return;
    }
    user.lastLogin = nowIso();
    saveDb();
    res.json({ user });
  });

  // Taxis CRUD
  app.post('/api/taxis', (req, res) => {
    const { taxi: taxiPayload, newOwner, newDriver, documents, actorName } = req.body as {
      taxi: Partial<Taxi>;
      newOwner?: Partial<Owner>;
      newDriver?: Partial<Driver>;
      documents?: Array<Partial<TaxiDocument>>;
      actorName?: string;
    };

    const user = actorName || 'Agent communal';
    let ownerId = taxiPayload.ownerId || '';
    if (!ownerId && newOwner?.fullName) {
      const createdOwner: Owner = {
        id: makeId('own'),
        fullName: newOwner.fullName.trim(),
        phone: (newOwner.phone || '').trim(),
        address: (newOwner.address || 'Antananarivo').trim(),
        cin: (newOwner.cin || '101 000 000 000').trim(),
        email: newOwner.email?.trim(),
        createdAt: nowIso().split('T')[0],
      };
      db.owners.unshift(createdOwner);
      ownerId = createdOwner.id;
    }

    let driverId = taxiPayload.driverId || '';
    if (!driverId && newDriver?.fullName) {
      const createdDriver: Driver = {
        id: makeId('drv'),
        fullName: newDriver.fullName.trim(),
        phone: (newDriver.phone || '').trim(),
        licenseNumber: (newDriver.licenseNumber || 'PC-EN-COURS').trim(),
        licenseCategory: 'B',
        licenseExpiry: newDriver.licenseExpiry || '2028-01-01',
        address: (newDriver.address || 'Antananarivo').trim(),
        status: 'ACTIF',
        createdAt: nowIso().split('T')[0],
      };
      db.drivers.unshift(createdDriver);
      driverId = createdDriver.id;
    }

    const plateNormalized = normalizePlate(taxiPayload.plate || '');
    const duplicate = db.taxis.find(
      (t) => t.plate.replace(/\s+/g, '') === plateNormalized.replace(/\s+/g, '')
    );
    if (duplicate) {
      res.status(409).json({ error: `Un taxi avec l'immatriculation ${plateNormalized} existe déjà.` });
      return;
    }

    const newTaxi: Taxi = {
      id: makeId('tax'),
      plate: plateNormalized,
      taxiNumber: (taxiPayload.taxiNumber || `CUA-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
      brand: (taxiPayload.brand || '').trim(),
      model: (taxiPayload.model || '').trim(),
      color: (taxiPayload.color || 'Crème').trim(),
      year: Number(taxiPayload.year) || 2005,
      zone: (taxiPayload.zone || 'Analakely').trim(),
      ownerId,
      driverId,
      status: (taxiPayload.status as TaxiStatus) || 'EN_VERIFICATION',
      authorizationNumber: (taxiPayload.authorizationNumber || '').trim(),
      validityDate: taxiPayload.validityDate || '2027-12-31',
      notes: taxiPayload.notes?.trim(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.taxis.unshift(newTaxi);

    if (Array.isArray(documents)) {
      for (const doc of documents) {
        if (!doc.type) continue;
        db.documents.push({
          id: makeId('doc'),
          taxiId: newTaxi.id,
          type: doc.type,
          label: doc.label || doc.type,
          documentNumber: doc.documentNumber || '',
          issueDate: doc.issueDate || nowIso().split('T')[0],
          expiryDate: doc.expiryDate || newTaxi.validityDate,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          verified: Boolean(doc.verified),
          verifiedBy: doc.verified ? user : undefined,
          updatedAt: nowIso().split('T')[0],
        });
      }
    }

    // Create associated licence record
    db.licences.unshift({
      id: makeId('lic'),
      taxiId: newTaxi.id,
      licenceNumber: `LIC-${newTaxi.taxiNumber}`,
      authorizationNumber: newTaxi.authorizationNumber,
      zone: newTaxi.zone,
      issueDate: nowIso().split('T')[0],
      expiryDate: newTaxi.validityDate,
      status: newTaxi.status === 'SUSPENDU' ? 'REVOQUEE' : 'ACTIVE',
      issuedBy: 'Direction des Transports CUA',
    });

    addHistory({
      entityType: 'TAXI',
      entityId: newTaxi.id,
      taxiId: newTaxi.id,
      action: 'Taxi enregistré',
      userName: user,
      details: `Enregistrement du taxi ${newTaxi.plate} (${newTaxi.brand} ${newTaxi.model}) dans la zone ${newTaxi.zone}.`,
    });

    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/taxis/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as { updates: Partial<Taxi>; actorName?: string };
    const idx = db.taxis.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Taxi introuvable.' });
      return;
    }
    const existing = db.taxis[idx];
    const updated: Taxi = {
      ...existing,
      ...updates,
      plate: updates.plate ? normalizePlate(updates.plate) : existing.plate,
      updatedAt: nowIso(),
    };
    db.taxis[idx] = updated;

    addHistory({
      entityType: 'TAXI',
      entityId: updated.id,
      taxiId: updated.id,
      action: 'Taxi modifié',
      userName: actorName || 'Agent communal',
      details: `Modification de la fiche du taxi ${updated.plate}.`,
    });

    saveDb();
    res.json(db);
  });

  app.patch('/api/taxis/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, reason, actorName } = req.body as {
      status: TaxiStatus;
      reason?: string;
      actorName?: string;
    };
    const taxi = db.taxis.find((t) => t.id === id);
    if (!taxi) {
      res.status(404).json({ error: 'Taxi introuvable.' });
      return;
    }
    taxi.status = status;
    taxi.updatedAt = nowIso();
    if (reason) taxi.notes = reason;

    addHistory({
      entityType: 'TAXI',
      entityId: taxi.id,
      taxiId: taxi.id,
      action: `Statut changé en ${status}`,
      userName: actorName || 'Agent communal',
      details: reason
        ? `Statut du taxi ${taxi.plate} modifié (${status}) : ${reason}`
        : `Statut du taxi ${taxi.plate} modifié (${status}).`,
    });

    saveDb();
    res.json(db);
  });

  app.delete('/api/taxis/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Administrateur';
    const taxi = db.taxis.find((t) => t.id === id);
    if (!taxi) {
      res.status(404).json({ error: 'Taxi introuvable.' });
      return;
    }
    db.taxis = db.taxis.filter((t) => t.id !== id);
    db.documents = db.documents.filter((d) => d.taxiId !== id);
    db.licences = db.licences.filter((l) => l.taxiId !== id);
    db.infractions = db.infractions.filter((i) => i.taxiId !== id);
    db.controls = db.controls.filter((c) => c.taxiId !== id);

    addHistory({
      entityType: 'TAXI',
      entityId: id,
      action: 'Taxi supprimé',
      userName: actorName,
      details: `Suppression définitive du taxi ${taxi.plate} (${taxi.taxiNumber}).`,
    });

    saveDb();
    res.json(db);
  });

  // Documents
  app.post('/api/documents', (req, res) => {
    const { doc, actorName } = req.body as { doc: Partial<TaxiDocument>; actorName?: string };
    if (!doc.taxiId || !doc.type) {
      res.status(400).json({ error: 'Données de document invalides.' });
      return;
    }
    const taxi = db.taxis.find((t) => t.id === doc.taxiId);
    const created: TaxiDocument = {
      id: makeId('doc'),
      taxiId: doc.taxiId,
      type: doc.type,
      label: doc.label || doc.type,
      documentNumber: doc.documentNumber || '',
      issueDate: doc.issueDate || nowIso().split('T')[0],
      expiryDate: doc.expiryDate || '',
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      verified: Boolean(doc.verified),
      verifiedBy: doc.verified ? actorName || 'Agent communal' : undefined,
      updatedAt: nowIso().split('T')[0],
    };
    db.documents.unshift(created);
    addHistory({
      entityType: 'TAXI',
      entityId: doc.taxiId,
      taxiId: doc.taxiId,
      action: `${created.label} ajouté(e)`,
      userName: actorName || 'Agent communal',
      details: `Document ${created.label} (${created.documentNumber || 'sans numéro'}) ajouté au taxi ${taxi?.plate || doc.taxiId}.`,
    });
    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/documents/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as { updates: Partial<TaxiDocument>; actorName?: string };
    const idx = db.documents.findIndex((d) => d.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Document introuvable.' });
      return;
    }
    const existing = db.documents[idx];
    db.documents[idx] = {
      ...existing,
      ...updates,
      updatedAt: nowIso().split('T')[0],
    };
    const taxi = db.taxis.find((t) => t.id === existing.taxiId);
    addHistory({
      entityType: 'TAXI',
      entityId: existing.taxiId,
      taxiId: existing.taxiId,
      action: 'Document mis à jour',
      userName: actorName || 'Agent communal',
      details: `Mise à jour de ${existing.label} pour le taxi ${taxi?.plate || existing.taxiId}.`,
    });
    saveDb();
    res.json(db);
  });

  app.delete('/api/documents/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Agent communal';
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) {
      res.status(404).json({ error: 'Document introuvable.' });
      return;
    }
    db.documents = db.documents.filter((d) => d.id !== id);
    const taxi = db.taxis.find((t) => t.id === doc.taxiId);
    addHistory({
      entityType: 'TAXI',
      entityId: doc.taxiId,
      taxiId: doc.taxiId,
      action: 'Document supprimé',
      userName: actorName,
      details: `Suppression de ${doc.label} du dossier du taxi ${taxi?.plate || doc.taxiId}.`,
    });
    saveDb();
    res.json(db);
  });

  // Drivers
  app.post('/api/drivers', (req, res) => {
    const { driver, actorName } = req.body as { driver: Partial<Driver>; actorName?: string };
    const created: Driver = {
      id: makeId('drv'),
      fullName: (driver.fullName || '').trim(),
      phone: (driver.phone || '').trim(),
      licenseNumber: (driver.licenseNumber || '').trim(),
      licenseCategory: driver.licenseCategory || 'B',
      licenseExpiry: driver.licenseExpiry || '2028-01-01',
      address: (driver.address || '').trim(),
      status: driver.status || 'ACTIF',
      createdAt: nowIso().split('T')[0],
    };
    db.drivers.unshift(created);
    addHistory({
      entityType: 'CHAUFFEUR',
      entityId: created.id,
      action: 'Chauffeur enregistré',
      userName: actorName || 'Agent communal',
      details: `Ajout du chauffeur ${created.fullName} (Permis ${created.licenseNumber}).`,
    });
    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as { updates: Partial<Driver>; actorName?: string };
    const idx = db.drivers.findIndex((d) => d.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Chauffeur introuvable.' });
      return;
    }
    db.drivers[idx] = { ...db.drivers[idx], ...updates };
    addHistory({
      entityType: 'CHAUFFEUR',
      entityId: id,
      action: 'Chauffeur modifié',
      userName: actorName || 'Agent communal',
      details: `Mise à jour de la fiche de ${db.drivers[idx].fullName}.`,
    });
    saveDb();
    res.json(db);
  });

  app.delete('/api/drivers/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Agent communal';
    const drv = db.drivers.find((d) => d.id === id);
    if (!drv) {
      res.status(404).json({ error: 'Chauffeur introuvable.' });
      return;
    }
    db.drivers = db.drivers.filter((d) => d.id !== id);
    addHistory({
      entityType: 'CHAUFFEUR',
      entityId: id,
      action: 'Chauffeur supprimé',
      userName: actorName,
      details: `Suppression du chauffeur ${drv.fullName}.`,
    });
    saveDb();
    res.json(db);
  });

  // Owners
  app.post('/api/owners', (req, res) => {
    const { owner, actorName } = req.body as { owner: Partial<Owner>; actorName?: string };
    const created: Owner = {
      id: makeId('own'),
      fullName: (owner.fullName || '').trim(),
      phone: (owner.phone || '').trim(),
      address: (owner.address || '').trim(),
      cin: (owner.cin || '').trim(),
      email: owner.email?.trim(),
      createdAt: nowIso().split('T')[0],
    };
    db.owners.unshift(created);
    addHistory({
      entityType: 'PROPRIETAIRE',
      entityId: created.id,
      action: 'Propriétaire enregistré',
      userName: actorName || 'Agent communal',
      details: `Ajout du propriétaire ${created.fullName}.`,
    });
    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/owners/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as { updates: Partial<Owner>; actorName?: string };
    const idx = db.owners.findIndex((o) => o.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Propriétaire introuvable.' });
      return;
    }
    db.owners[idx] = { ...db.owners[idx], ...updates };
    addHistory({
      entityType: 'PROPRIETAIRE',
      entityId: id,
      action: 'Propriétaire modifié',
      userName: actorName || 'Agent communal',
      details: `Mise à jour de ${db.owners[idx].fullName}.`,
    });
    saveDb();
    res.json(db);
  });

  app.delete('/api/owners/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Agent communal';
    const own = db.owners.find((o) => o.id === id);
    if (!own) {
      res.status(404).json({ error: 'Propriétaire introuvable.' });
      return;
    }
    db.owners = db.owners.filter((o) => o.id !== id);
    addHistory({
      entityType: 'PROPRIETAIRE',
      entityId: id,
      action: 'Propriétaire supprimé',
      userName: actorName,
      details: `Suppression du propriétaire ${own.fullName}.`,
    });
    saveDb();
    res.json(db);
  });

  // Licences
  app.post('/api/licences', (req, res) => {
    const { licence, actorName } = req.body as {
      licence: Partial<LicenceAuthorization>;
      actorName?: string;
    };
    const created: LicenceAuthorization = {
      id: makeId('lic'),
      taxiId: licence.taxiId || '',
      licenceNumber: (licence.licenceNumber || '').trim(),
      authorizationNumber: (licence.authorizationNumber || '').trim(),
      zone: licence.zone || 'Analakely',
      issueDate: licence.issueDate || nowIso().split('T')[0],
      expiryDate: licence.expiryDate || '2027-12-31',
      status: licence.status || 'ACTIVE',
      issuedBy: licence.issuedBy || 'Direction des Transports CUA',
      notes: licence.notes,
    };
    db.licences.unshift(created);
    const taxi = db.taxis.find((t) => t.id === created.taxiId);
    if (taxi && created.status === 'ACTIVE') {
      taxi.authorizationNumber = created.authorizationNumber;
      taxi.validityDate = created.expiryDate;
      taxi.updatedAt = nowIso();
    }
    addHistory({
      entityType: 'LICENCE',
      entityId: created.id,
      taxiId: created.taxiId,
      action: 'Licence délivrée',
      userName: actorName || 'Agent communal',
      details: `Licence ${created.licenceNumber} attribuée au taxi ${taxi?.plate || created.taxiId}.`,
    });
    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/licences/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as {
      updates: Partial<LicenceAuthorization>;
      actorName?: string;
    };
    const idx = db.licences.findIndex((l) => l.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Licence introuvable.' });
      return;
    }
    db.licences[idx] = { ...db.licences[idx], ...updates };
    const lic = db.licences[idx];
    const taxi = db.taxis.find((t) => t.id === lic.taxiId);
    if (taxi && lic.status === 'REVOQUEE') {
      taxi.status = 'SUSPENDU';
      taxi.updatedAt = nowIso();
    } else if (taxi && lic.status === 'ACTIVE') {
      taxi.validityDate = lic.expiryDate;
      taxi.updatedAt = nowIso();
    }
    addHistory({
      entityType: 'LICENCE',
      entityId: id,
      taxiId: lic.taxiId,
      action: lic.status === 'REVOQUEE' ? 'Licence révoquée' : 'Licence mise à jour',
      userName: actorName || 'Agent communal',
      details: `Licence ${lic.licenceNumber} (${taxi?.plate || ''}) mise à jour (${lic.status}).`,
    });
    saveDb();
    res.json(db);
  });

  app.delete('/api/licences/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Administrateur';
    const lic = db.licences.find((l) => l.id === id);
    if (!lic) {
      res.status(404).json({ error: 'Licence introuvable.' });
      return;
    }
    db.licences = db.licences.filter((l) => l.id !== id);
    addHistory({
      entityType: 'LICENCE',
      entityId: id,
      taxiId: lic.taxiId,
      action: 'Licence supprimée',
      userName: actorName,
      details: `Suppression de la licence ${lic.licenceNumber}.`,
    });
    saveDb();
    res.json(db);
  });

  // Infractions
  app.post('/api/infractions', (req, res) => {
    const { infraction, actorName } = req.body as {
      infraction: Partial<Infraction>;
      actorName?: string;
    };
    const taxi = db.taxis.find((t) => t.id === infraction.taxiId);
    const created: Infraction = {
      id: makeId('inf'),
      taxiId: infraction.taxiId || '',
      driverId: infraction.driverId || taxi?.driverId || '',
      date: infraction.date || nowIso().split('T')[0],
      type: (infraction.type || '').trim(),
      description: (infraction.description || '').trim(),
      severity: infraction.severity || 'MOYENNE',
      status: infraction.status || 'OUVERTE',
      zone: infraction.zone || taxi?.zone || 'Analakely',
      agentName: infraction.agentName || actorName || 'Agent communal',
      fineAmountAriary: infraction.fineAmountAriary ? Number(infraction.fineAmountAriary) : undefined,
    };
    db.infractions.unshift(created);
    addHistory({
      entityType: 'INFRACTION',
      entityId: created.id,
      taxiId: created.taxiId,
      action: 'Infraction enregistrée',
      userName: actorName || created.agentName,
      details: `${created.type} (${created.severity}) sur le taxi ${taxi?.plate || created.taxiId}.`,
    });
    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/infractions/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as {
      updates: Partial<Infraction>;
      actorName?: string;
    };
    const idx = db.infractions.findIndex((i) => i.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Infraction introuvable.' });
      return;
    }
    db.infractions[idx] = { ...db.infractions[idx], ...updates };
    const inf = db.infractions[idx];
    const taxi = db.taxis.find((t) => t.id === inf.taxiId);
    addHistory({
      entityType: 'INFRACTION',
      entityId: id,
      taxiId: inf.taxiId,
      action: 'Infraction mise à jour',
      userName: actorName || 'Agent communal',
      details: `Infraction "${inf.type}" sur ${taxi?.plate || inf.taxiId} passée à ${inf.status}.`,
    });
    saveDb();
    res.json(db);
  });

  app.delete('/api/infractions/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Administrateur';
    const inf = db.infractions.find((i) => i.id === id);
    if (!inf) {
      res.status(404).json({ error: 'Infraction introuvable.' });
      return;
    }
    db.infractions = db.infractions.filter((i) => i.id !== id);
    addHistory({
      entityType: 'INFRACTION',
      entityId: id,
      taxiId: inf.taxiId,
      action: 'Infraction supprimée',
      userName: actorName,
      details: `Suppression de l'infraction "${inf.type}".`,
    });
    saveDb();
    res.json(db);
  });

  // Controls / Scanner logs
  app.post('/api/controls', (req, res) => {
    const { control, actorName } = req.body as {
      control: Partial<ControlInspection>;
      actorName?: string;
    };
    const taxi = db.taxis.find((t) => t.id === control.taxiId);
    const created: ControlInspection = {
      id: makeId('ctl'),
      taxiId: control.taxiId || '',
      dateTime: control.dateTime || nowIso(),
      zone: control.zone || taxi?.zone || 'Analakely',
      agentName: control.agentName || actorName || 'Agent communal',
      result: control.result || 'CONFORME',
      notes: control.notes || 'Contrôle effectué.',
      method: control.method || 'SCAN',
    };
    db.controls.unshift(created);
    addHistory({
      entityType: 'CONTROLE',
      entityId: created.id,
      taxiId: created.taxiId,
      action: `Contrôle effectué (${created.result})`,
      userName: actorName || created.agentName,
      details: `Contrôle ${created.method.toLowerCase()} sur ${taxi?.plate || created.taxiId} à ${created.zone}.`,
    });
    saveDb();
    res.status(201).json(db);
  });

  // Users (Admin)
  app.post('/api/users', (req, res) => {
    const { user, actorName } = req.body as { user: Partial<UserAccount>; actorName?: string };
    const created: UserAccount = {
      id: makeId('usr'),
      firstName: (user.firstName || '').trim(),
      lastName: (user.lastName || '').trim(),
      email: (user.email || '').trim().toLowerCase(),
      phone: (user.phone || '').trim(),
      role: user.role || 'AGENT_COMMUNAL',
      status: user.status || 'ACTIF',
      lastLogin: nowIso(),
      badgeNumber: (user.badgeNumber || `AGT-${Math.floor(100 + Math.random() * 899)}`).trim(),
      password: user.password || 'CuaTaxi2026!',
    };
    db.users.unshift(created);
    addHistory({
      entityType: 'UTILISATEUR',
      entityId: created.id,
      action: 'Compte utilisateur créé',
      userName: actorName || 'Administrateur',
      details: `Création du compte ${created.firstName} ${created.lastName} (${created.role}).`,
    });
    saveDb();
    res.status(201).json(db);
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { updates, actorName } = req.body as { updates: Partial<UserAccount>; actorName?: string };
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }
    db.users[idx] = { ...db.users[idx], ...updates };
    addHistory({
      entityType: 'UTILISATEUR',
      entityId: id,
      action: 'Compte utilisateur modifié',
      userName: actorName || 'Administrateur',
      details: `Mise à jour du compte ${db.users[idx].firstName} ${db.users[idx].lastName}.`,
    });
    saveDb();
    res.json(db);
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const actorName = (req.query.actorName as string) || 'Administrateur';
    const usr = db.users.find((u) => u.id === id);
    if (!usr) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }
    db.users = db.users.filter((u) => u.id !== id);
    addHistory({
      entityType: 'UTILISATEUR',
      entityId: id,
      action: 'Compte utilisateur supprimé',
      userName: actorName,
      details: `Suppression du compte ${usr.firstName} ${usr.lastName}.`,
    });
    saveDb();
    res.json(db);
  });

  // Settings
  app.put('/api/settings', (req, res) => {
    const { settings, actorName } = req.body as {
      settings: Partial<AppSettings>;
      actorName?: string;
    };
    db.settings = { ...db.settings, ...settings };
    addHistory({
      entityType: 'PARAMETRES',
      entityId: 'settings',
      action: 'Paramètres mis à jour',
      userName: actorName || 'Administrateur',
      details: 'Modification des paramètres généraux de l’application.',
    });
    saveDb();
    res.json(db);
  });

  // Notifications mark read
  app.post('/api/notifications/read', (req, res) => {
    const { id } = req.body as { id?: string };
    if (id) {
      db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    } else {
      db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
    }
    saveDb();
    res.json(db);
  });

  // Vite integration in dev vs static dist in prod
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CUA Taxi server listening on http://localhost:${PORT}`);
  });
}

startServer();
