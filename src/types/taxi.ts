export type TaxiStatus =
  | 'AUTORISE'
  | 'NON_AUTORISE'
  | 'SUSPENDU'
  | 'EN_VERIFICATION';

export type DocumentType =
  | 'CARTE_GRISE'
  | 'ASSURANCE'
  | 'LICENCE'
  | 'AUTORISATION';

export type DocumentStatus =
  | 'VALIDE'
  | 'BIENTOT_EXPIRE'
  | 'EXPIRE'
  | 'MANQUANT';

export type InfractionSeverity =
  | 'FAIBLE'
  | 'MOYENNE'
  | 'GRAVE'
  | 'TRES_GRAVE';

export type InfractionStatus =
  | 'OUVERTE'
  | 'EN_COURS'
  | 'REGLEE'
  | 'CONTESTEE';

export type DriverStatus = 'ACTIF' | 'INACTIF' | 'SUSPENDU';

export type UserRole = 'ADMINISTRATEUR' | 'AGENT_COMMUNAL';
export type UserStatus = 'ACTIF' | 'DESACTIVE';

export type LicenceStatus = 'ACTIVE' | 'BIENTOT_EXPIREE' | 'EXPIREE' | 'REVOQUEE';

export interface Owner {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  cin: string;
  email?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  address: string;
  status: DriverStatus;
  createdAt: string;
}

export interface TaxiDocument {
  id: string;
  taxiId: string;
  type: DocumentType;
  label: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileName?: string;
  fileSize?: string;
  verified: boolean;
  verifiedBy?: string;
  updatedAt: string;
}

export interface Taxi {
  id: string;
  plate: string;
  taxiNumber: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  zone: string;
  ownerId: string;
  driverId: string;
  status: TaxiStatus;
  authorizationNumber: string;
  validityDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenceAuthorization {
  id: string;
  taxiId: string;
  licenceNumber: string;
  authorizationNumber: string;
  zone: string;
  issueDate: string;
  expiryDate: string;
  status: LicenceStatus;
  issuedBy: string;
  notes?: string;
}

export interface Infraction {
  id: string;
  taxiId: string;
  driverId: string;
  date: string;
  type: string;
  description: string;
  severity: InfractionSeverity;
  status: InfractionStatus;
  zone: string;
  agentName: string;
  fineAmountAriary?: number;
}

export interface ControlInspection {
  id: string;
  taxiId: string;
  dateTime: string;
  zone: string;
  agentName: string;
  result: 'CONFORME' | 'AVERTISSEMENT' | 'NON_CONFORME';
  notes: string;
  method: 'SCAN' | 'MANUEL';
}

export interface HistoryEvent {
  id: string;
  entityType: 'TAXI' | 'CHAUFFEUR' | 'PROPRIETAIRE' | 'LICENCE' | 'INFRACTION' | 'CONTROLE' | 'UTILISATEUR' | 'PARAMETRES';
  entityId: string;
  taxiId?: string;
  dateTime: string;
  action: string;
  userName: string;
  details: string;
}

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  password?: string;
  badgeNumber: string;
}

export interface AppNotification {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  taxiId?: string;
}

export interface AppSettings {
  municipalityName: string;
  departmentName: string;
  expiryWarningDays: number;
  defaultPageSize: number;
  requireConfirmationForStatusChange: boolean;
  emailAlertsEnabled: boolean;
  autoFlagExpiredDocuments: boolean;
  sessionTimeoutMinutes: number;
}

export interface AppDatabase {
  taxis: Taxi[];
  drivers: Driver[];
  owners: Owner[];
  documents: TaxiDocument[];
  licences: LicenceAuthorization[];
  infractions: Infraction[];
  controls: ControlInspection[];
  history: HistoryEvent[];
  users: UserAccount[];
  notifications: AppNotification[];
  settings: AppSettings;
}

export type AppPage =
  | 'dashboard'
  | 'taxis'
  | 'taxi-detail'
  | 'drivers'
  | 'owners'
  | 'licences'
  | 'infractions'
  | 'scanner'
  | 'reports'
  | 'history'
  | 'users'
  | 'settings';
