import type {
  AppDatabase,
  AppSettings,
  ControlInspection,
  Driver,
  Infraction,
  LicenceAuthorization,
  Owner,
  Taxi,
  TaxiDocument,
  TaxiStatus,
  UserAccount,
} from '../types/taxi';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Impossible de charger les données.');
  }
  return data as T;
}

export const api = {
  bootstrap: () => request<AppDatabase>('/api/bootstrap'),
  resetDemo: () => request<AppDatabase>('/api/reset-demo', { method: 'POST' }),
  login: (email: string, password: string) =>
    request<{ user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  createTaxi: (payload: {
    taxi: Partial<Taxi>;
    newOwner?: Partial<Owner>;
    newDriver?: Partial<Driver>;
    documents?: Array<Partial<TaxiDocument>>;
    actorName?: string;
  }) =>
    request<AppDatabase>('/api/taxis', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTaxi: (id: string, updates: Partial<Taxi>, actorName?: string) =>
    request<AppDatabase>(`/api/taxis/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  updateTaxiStatus: (id: string, status: TaxiStatus, reason?: string, actorName?: string) =>
    request<AppDatabase>(`/api/taxis/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, actorName }),
    }),

  deleteTaxi: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/taxis/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  addDocument: (doc: Partial<TaxiDocument>, actorName?: string) =>
    request<AppDatabase>('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ doc, actorName }),
    }),

  updateDocument: (id: string, updates: Partial<TaxiDocument>, actorName?: string) =>
    request<AppDatabase>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  deleteDocument: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/documents/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  createDriver: (driver: Partial<Driver>, actorName?: string) =>
    request<AppDatabase>('/api/drivers', {
      method: 'POST',
      body: JSON.stringify({ driver, actorName }),
    }),

  updateDriver: (id: string, updates: Partial<Driver>, actorName?: string) =>
    request<AppDatabase>(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  deleteDriver: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/drivers/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  createOwner: (owner: Partial<Owner>, actorName?: string) =>
    request<AppDatabase>('/api/owners', {
      method: 'POST',
      body: JSON.stringify({ owner, actorName }),
    }),

  updateOwner: (id: string, updates: Partial<Owner>, actorName?: string) =>
    request<AppDatabase>(`/api/owners/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  deleteOwner: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/owners/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  createLicence: (licence: Partial<LicenceAuthorization>, actorName?: string) =>
    request<AppDatabase>('/api/licences', {
      method: 'POST',
      body: JSON.stringify({ licence, actorName }),
    }),

  updateLicence: (id: string, updates: Partial<LicenceAuthorization>, actorName?: string) =>
    request<AppDatabase>(`/api/licences/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  deleteLicence: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/licences/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  createInfraction: (infraction: Partial<Infraction>, actorName?: string) =>
    request<AppDatabase>('/api/infractions', {
      method: 'POST',
      body: JSON.stringify({ infraction, actorName }),
    }),

  updateInfraction: (id: string, updates: Partial<Infraction>, actorName?: string) =>
    request<AppDatabase>(`/api/infractions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  deleteInfraction: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/infractions/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  createControl: (control: Partial<ControlInspection>, actorName?: string) =>
    request<AppDatabase>('/api/controls', {
      method: 'POST',
      body: JSON.stringify({ control, actorName }),
    }),

  createUser: (user: Partial<UserAccount>, actorName?: string) =>
    request<AppDatabase>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ user, actorName }),
    }),

  updateUser: (id: string, updates: Partial<UserAccount>, actorName?: string) =>
    request<AppDatabase>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, actorName }),
    }),

  deleteUser: (id: string, actorName?: string) =>
    request<AppDatabase>(`/api/users/${id}?actorName=${encodeURIComponent(actorName || '')}`, {
      method: 'DELETE',
    }),

  updateSettings: (settings: Partial<AppSettings>, actorName?: string) =>
    request<AppDatabase>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings, actorName }),
    }),

  markNotificationsRead: (id?: string) =>
    request<AppDatabase>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
};
