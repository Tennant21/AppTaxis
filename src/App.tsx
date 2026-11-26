import { useCallback, useEffect, useState } from 'react';
import type {
  AppDatabase,
  AppPage,
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
} from './types/taxi';
import { api } from './services/api';
import { Layout } from './components/Layout';
import { ToastContainer, type ToastItem } from './components/ui/ToastContainer';
import { ErrorState, SkeletonDashboard } from './components/ui/States';
import { TaxiFormModal } from './components/TaxiFormModal';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { TaxisView } from './views/TaxisView';
import { TaxiDetailView } from './views/TaxiDetailView';
import { DriversView } from './views/DriversView';
import { OwnersView } from './views/OwnersView';
import { LicencesView } from './views/LicencesView';
import { InfractionsView } from './views/InfractionsView';
import { ScannerView } from './views/ScannerView';
import { ReportsView } from './views/ReportsView';
import { HistoryView } from './views/HistoryView';
import { UsersView } from './views/UsersView';
import { SettingsProfileView } from './views/SettingsProfileView';

const SESSION_STORAGE_KEY = 'cua_taxi_session_user_id';

const PAGE_TITLES: Record<AppPage, { title: string; breadcrumb: string }> = {
  dashboard: { title: 'Tableau de bord', breadcrumb: 'Commune Urbaine d’Antananarivo / Accueil' },
  taxis: { title: 'Taxis', breadcrumb: 'Gestion du parc / Taxis' },
  'taxi-detail': { title: 'Dossier taxi', breadcrumb: 'Gestion du parc / Taxis / Fiche détaillée' },
  drivers: { title: 'Chauffeurs', breadcrumb: 'Acteurs / Chauffeurs' },
  owners: { title: 'Propriétaires', breadcrumb: 'Acteurs / Propriétaires' },
  licences: { title: 'Licences & autorisations', breadcrumb: 'Réglementation / Licences' },
  infractions: { title: 'Infractions', breadcrumb: 'Contrôle / Infractions' },
  scanner: { title: 'Scanner & contrôles', breadcrumb: 'Contrôle terrain / Scanner' },
  reports: { title: 'Rapports & statistiques', breadcrumb: 'Pilotage / Rapports' },
  history: { title: 'Historique', breadcrumb: 'Traçabilité / Historique' },
  users: { title: 'Utilisateurs', breadcrumb: 'Administration / Utilisateurs' },
  settings: { title: 'Profil & paramètres', breadcrumb: 'Compte / Paramètres' },
};

export default function App() {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [selectedTaxiId, setSelectedTaxiId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const [taxiModalOpen, setTaxiModalOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.bootstrap();
      setDb(data);

      const params = new URLSearchParams(window.location.search);
      const autostart = params.get('autostart') === '1';
      const savedId = window.localStorage.getItem(SESSION_STORAGE_KEY);

      if (autostart) {
        const defaultUser = data.users.find((u) => u.status === 'ACTIF') || data.users[0];
        if (defaultUser) {
          setCurrentUser(defaultUser);
          window.localStorage.setItem(SESSION_STORAGE_KEY, defaultUser.id);
        }
      } else if (savedId) {
        const found = data.users.find((u) => u.id === savedId && u.status === 'ACTIF');
        if (found) setCurrentUser(found);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actorName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Agent communal';

  const handleLogin = async (email: string, password: string) => {
    const { user } = await api.login(email, password);
    const refreshed = await api.bootstrap();
    setDb(refreshed);
    setCurrentUser(user);
    window.localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    setCurrentPage('dashboard');
    pushToast('SUCCESS', `Bienvenue, ${user.firstName} ${user.lastName}.`);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setSelectedTaxiId(null);
  };

  const handleNavigate = (page: AppPage, taxiId?: string) => {
    if (taxiId) setSelectedTaxiId(taxiId);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalSearchSubmit = () => {
    if (currentPage !== 'taxis') {
      setCurrentPage('taxis');
    }
  };

  const handleSaveTaxi = async (payload: {
    taxi: Partial<Taxi>;
    newOwner?: Partial<Owner>;
    newDriver?: Partial<Driver>;
    documents?: Array<Partial<TaxiDocument>>;
  }) => {
    if (editingTaxi) {
      const next = await api.updateTaxi(editingTaxi.id, payload.taxi, actorName);
      setDb(next);
      pushToast('SUCCESS', `Le taxi ${payload.taxi.plate || editingTaxi.plate} a été modifié avec succès.`);
    } else {
      const next = await api.createTaxi({ ...payload, actorName });
      setDb(next);
      pushToast('SUCCESS', 'Le taxi a été enregistré avec succès.');
    }
  };

  if (loading && !db) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] p-6 max-w-[1440px] mx-auto">
        <SkeletonDashboard />
      </div>
    );
  }

  if (loadError && !db) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <ErrorState
            title="Une erreur est survenue"
            description={loadError}
            onRetry={loadData}
          />
        </div>
      </div>
    );
  }

  if (!db) return null;

  if (!currentUser) {
    return (
      <>
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        />
        <LoginView onLogin={handleLogin} />
      </>
    );
  }

  const pageInfo = PAGE_TITLES[currentPage];

  return (
    <>
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <Layout
        currentPage={currentPage}
        pageTitle={pageInfo.title}
        breadcrumb={pageInfo.breadcrumb}
        user={currentUser}
        notifications={db.notifications}
        globalSearch={globalSearch}
        onGlobalSearchChange={(q) => {
          setGlobalSearch(q);
          if (q.trim() && currentPage === 'dashboard') {
            // Keep responsive while user can hit enter or navigate to Taxis
          }
        }}
        onGlobalSearchSubmit={handleGlobalSearchSubmit}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onMarkNotificationRead={async (id) => {
          const next = await api.markNotificationsRead(id);
          setDb(next);
        }}
      >
        {currentPage === 'dashboard' && (
          <DashboardView
            db={db}
            user={currentUser}
            onNavigate={handleNavigate}
            onOpenAddTaxi={() => {
              setEditingTaxi(null);
              setTaxiModalOpen(true);
            }}
          />
        )}

        {currentPage === 'taxis' && (
          <TaxisView
            db={db}
            searchQuery={globalSearch}
            onSearchQueryChange={setGlobalSearch}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
            onOpenAddTaxi={() => {
              setEditingTaxi(null);
              setTaxiModalOpen(true);
            }}
            onEditTaxi={(taxi) => {
              setEditingTaxi(taxi);
              setTaxiModalOpen(true);
            }}
            onChangeStatus={async (id, status: TaxiStatus, reason?: string) => {
              const next = await api.updateTaxiStatus(id, status, reason, actorName);
              setDb(next);
              pushToast(
                status === 'SUSPENDU' ? 'WARNING' : 'SUCCESS',
                `Le statut du taxi a été mis à jour.`
              );
            }}
            onDeleteTaxi={async (id) => {
              const next = await api.deleteTaxi(id, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Le taxi a été supprimé.');
            }}
          />
        )}

        {currentPage === 'taxi-detail' && selectedTaxiId && (
          <TaxiDetailView
            db={db}
            taxiId={selectedTaxiId}
            onBack={() => handleNavigate('taxis')}
            onEditTaxi={(taxi) => {
              setEditingTaxi(taxi);
              setTaxiModalOpen(true);
            }}
            onChangeStatus={async (id, status, reason) => {
              const next = await api.updateTaxiStatus(id, status, reason, actorName);
              setDb(next);
              pushToast(
                status === 'SUSPENDU' ? 'WARNING' : 'SUCCESS',
                `Statut mis à jour avec succès.`
              );
            }}
            onAddDocument={async (doc) => {
              const next = await api.addDocument(doc, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Document ajouté au dossier.');
            }}
            onVerifyDocument={async (docId, verified) => {
              const next = await api.updateDocument(
                docId,
                { verified, verifiedBy: actorName },
                actorName
              );
              setDb(next);
              pushToast('SUCCESS', 'Document vérifié et validé.');
            }}
            onDeleteDocument={async (docId) => {
              const next = await api.deleteDocument(docId, actorName);
              setDb(next);
              pushToast('INFO', 'Document supprimé du dossier.');
            }}
            onAddInfraction={async (inf) => {
              const next = await api.createInfraction(inf, actorName);
              setDb(next);
              pushToast('WARNING', 'Infraction enregistrée dans le dossier.');
            }}
          />
        )}

        {currentPage === 'drivers' && (
          <DriversView
            db={db}
            onCreateDriver={async (driver) => {
              const next = await api.createDriver(driver, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Chauffeur enregistré avec succès.');
            }}
            onUpdateDriver={async (id, updates) => {
              const next = await api.updateDriver(id, updates, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Fiche chauffeur mise à jour.');
            }}
            onDeleteDriver={async (id) => {
              const next = await api.deleteDriver(id, actorName);
              setDb(next);
              pushToast('INFO', 'Chauffeur supprimé.');
            }}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
          />
        )}

        {currentPage === 'owners' && (
          <OwnersView
            db={db}
            onCreateOwner={async (owner) => {
              const next = await api.createOwner(owner, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Propriétaire enregistré avec succès.');
            }}
            onUpdateOwner={async (id, updates) => {
              const next = await api.updateOwner(id, updates, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Fiche propriétaire mise à jour.');
            }}
            onDeleteOwner={async (id) => {
              const next = await api.deleteOwner(id, actorName);
              setDb(next);
              pushToast('INFO', 'Propriétaire supprimé.');
            }}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
          />
        )}

        {currentPage === 'licences' && (
          <LicencesView
            db={db}
            onCreateLicence={async (lic: Partial<LicenceAuthorization>) => {
              const next = await api.createLicence(lic, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Licence délivrée avec succès.');
            }}
            onUpdateLicence={async (id, updates) => {
              const next = await api.updateLicence(id, updates, actorName);
              setDb(next);
              pushToast(
                updates.status === 'REVOQUEE' ? 'WARNING' : 'SUCCESS',
                updates.status === 'REVOQUEE'
                  ? 'Licence révoquée.'
                  : 'Licence renouvelée avec succès.'
              );
            }}
            onDeleteLicence={async (id) => {
              const next = await api.deleteLicence(id, actorName);
              setDb(next);
              pushToast('INFO', 'Licence supprimée.');
            }}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
          />
        )}

        {currentPage === 'infractions' && (
          <InfractionsView
            db={db}
            onCreateInfraction={async (inf) => {
              const next = await api.createInfraction(inf, actorName);
              setDb(next);
              pushToast('WARNING', 'Infraction enregistrée.');
            }}
            onUpdateInfraction={async (id, updates) => {
              const next = await api.updateInfraction(id, updates, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Infraction mise à jour.');
            }}
            onDeleteInfraction={async (id) => {
              const next = await api.deleteInfraction(id, actorName);
              setDb(next);
              pushToast('INFO', 'Infraction supprimée.');
            }}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
          />
        )}

        {currentPage === 'scanner' && (
          <ScannerView
            db={db}
            onLogControl={async (control: Partial<ControlInspection>) => {
              const next = await api.createControl(control, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Contrôle enregistré dans le journal.');
            }}
            onCreateInfraction={async (inf) => {
              const next = await api.createInfraction(inf, actorName);
              setDb(next);
              pushToast('WARNING', 'Infraction associée enregistrée.');
            }}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
          />
        )}

        {currentPage === 'reports' && <ReportsView db={db} />}

        {currentPage === 'history' && (
          <HistoryView
            db={db}
            onViewTaxi={(id) => handleNavigate('taxi-detail', id)}
          />
        )}

        {currentPage === 'users' && (
          <UsersView
            db={db}
            currentUser={currentUser}
            onCreateUser={async (usr) => {
              const next = await api.createUser(usr, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Compte utilisateur créé.');
            }}
            onUpdateUser={async (id, updates) => {
              const next = await api.updateUser(id, updates, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Compte utilisateur mis à jour.');
            }}
            onDeleteUser={async (id) => {
              const next = await api.deleteUser(id, actorName);
              setDb(next);
              pushToast('INFO', 'Compte utilisateur supprimé.');
            }}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsProfileView
            db={db}
            currentUser={currentUser}
            onUpdateProfile={async (updates) => {
              const next = await api.updateUser(currentUser.id, updates, actorName);
              setDb(next);
              const updatedMe = next.users.find((u) => u.id === currentUser.id);
              if (updatedMe) setCurrentUser(updatedMe);
              pushToast('SUCCESS', 'Profil mis à jour avec succès.');
            }}
            onUpdateSettings={async (settings: Partial<AppSettings>) => {
              const next = await api.updateSettings(settings, actorName);
              setDb(next);
              pushToast('SUCCESS', 'Paramètres enregistrés.');
            }}
            onResetDemo={async () => {
              const next = await api.resetDemo();
              setDb(next);
              pushToast('INFO', 'Données initiales restaurées.');
            }}
            onLogout={handleLogout}
          />
        )}
      </Layout>

      <TaxiFormModal
        open={taxiModalOpen}
        onClose={() => {
          setTaxiModalOpen(false);
          setEditingTaxi(null);
        }}
        drivers={db.drivers}
        owners={db.owners}
        editingTaxi={editingTaxi}
        onSubmit={handleSaveTaxi}
      />
    </>
  );
}
