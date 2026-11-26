import React, { useState } from 'react';
import { Lock, LogOut, RotateCcw, Save, Shield, User } from 'lucide-react';
import type { AppDatabase, AppSettings, UserAccount } from '../types/taxi';
import { formatDateTimeFR, formatPhoneMG } from '../utils/taxiLogic';
import { Button } from '../components/ui/Button';
import { Input, Select, Switch } from '../components/ui/FormControls';
import { ConfirmDialog, Modal } from '../components/ui/Modal';

interface SettingsProfileViewProps {
  db: AppDatabase;
  currentUser: UserAccount;
  onUpdateProfile: (updates: Partial<UserAccount>) => Promise<void>;
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onLogout: () => void;
}

export const SettingsProfileView: React.FC<SettingsProfileViewProps> = ({
  db,
  currentUser,
  onUpdateProfile,
  onUpdateSettings,
  onResetDemo,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'ADMINISTRATEUR';
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [profileSaving, setProfileSaving] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(db.settings);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await onUpdateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await onUpdateSettings(settings);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) {
      setPwdError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setPwdError('');
    await onUpdateProfile({ password: newPwd });
    setPwdModalOpen(false);
    setNewPwd('');
    setConfirmPwd('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-bold text-[#172B4D]">Profil & paramètres</h2>
        <p className="mt-1 text-[14px] text-[#52627A]">
          Informations de votre compte agent et préférences de l’application municipale.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Compte / Profil */}
        <div className="lg:col-span-5 rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#DCE4EF] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#174EA6] text-[15px] font-bold text-white">
                {currentUser.firstName[0]}
                {currentUser.lastName[0]}
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#172B4D]">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p className="text-[12px] text-[#52627A]">
                  {currentUser.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Agent communal'} · {currentUser.badgeNumber}
                </p>
              </div>
            </div>
          </div>

          <dl className="space-y-2 text-[13px] bg-[#FFF3C4] rounded-[8px] p-3.5">
            <div className="flex justify-between gap-2">
              <dt className="text-[#52627A]">Email</dt>
              <dd className="font-medium text-[#172B4D]">{currentUser.email}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#52627A]">Téléphone</dt>
              <dd className="font-medium text-[#172B4D] tabular-nums">
                {formatPhoneMG(currentUser.phone)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#52627A]">Dernière connexion</dt>
              <dd className="font-medium text-[#172B4D] tabular-nums">
                {formatDateTimeFR(currentUser.lastLogin)}
              </dd>
            </div>
          </dl>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={profileSaving}
                icon={<User className="h-4 w-4" />}
              >
                Modifier le profil
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Lock className="h-4 w-4" />}
                onClick={() => setPwdModalOpen(true)}
              >
                Changer le mot de passe
              </Button>
            </div>
          </form>

          <div className="border-t border-[#DCE4EF] pt-4">
            <Button
              variant="danger"
              size="sm"
              icon={<LogOut className="h-4 w-4" />}
              onClick={onLogout}
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Paramètres généraux, notifications, sécurité */}
        <div className="lg:col-span-7 rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex items-center justify-between border-b border-[#DCE4EF] pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#174EA6]" aria-hidden="true" />
              <h3 className="text-[18px] font-semibold text-[#172B4D]">
                Paramètres généraux & sécurité
              </h3>
            </div>
            {!isAdmin && (
              <span className="text-[12px] font-medium text-[#52627A]">
                Modification réservée à l’administrateur
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution"
                value={settings.municipalityName}
                disabled={!isAdmin}
                onChange={(e) =>
                  setSettings({ ...settings, municipalityName: e.target.value })
                }
              />
              <Input
                label="Direction responsable"
                value={settings.departmentName}
                disabled={!isAdmin}
                onChange={(e) =>
                  setSettings({ ...settings, departmentName: e.target.value })
                }
              />
              <Input
                label="Seuil d’alerte expiration (jours)"
                type="number"
                value={settings.expiryWarningDays}
                disabled={!isAdmin}
                onChange={(e) =>
                  setSettings({ ...settings, expiryWarningDays: Number(e.target.value) || 30 })
                }
              />
              <Select
                label="Éléments par page (tableaux)"
                value={String(settings.defaultPageSize)}
                disabled={!isAdmin}
                onChange={(e) =>
                  setSettings({ ...settings, defaultPageSize: Number(e.target.value) })
                }
                options={[
                  { value: '10', label: '10 lignes par page' },
                  { value: '20', label: '20 lignes par page' },
                  { value: '50', label: '50 lignes par page' },
                ]}
              />
            </div>

            <div className="border-t border-[#DCE4EF] pt-3 divide-y divide-[#DCE4EF]">
              <Switch
                label="Confirmation obligatoire avant changement de statut"
                description="Affiche une modale de confirmation avant toute suspension ou révocation."
                checked={settings.requireConfirmationForStatusChange}
                disabled={!isAdmin}
                onChange={(v) =>
                  setSettings({ ...settings, requireConfirmationForStatusChange: v })
                }
              />
              <Switch
                label="Alertes automatiques de documents expirés"
                description="Signale automatiquement sur le tableau de bord les pièces arrivant à échéance."
                checked={settings.autoFlagExpiredDocuments}
                disabled={!isAdmin}
                onChange={(v) =>
                  setSettings({ ...settings, autoFlagExpiredDocuments: v })
                }
              />
              <Switch
                label="Notifications par email"
                description="Transmet un récapitulatif hebdomadaire aux responsables communaux."
                checked={settings.emailAlertsEnabled}
                disabled={!isAdmin}
                onChange={(v) =>
                  setSettings({ ...settings, emailAlertsEnabled: v })
                }
              />
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE4EF] pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="h-4 w-4" />}
                  onClick={() => setResetOpen(true)}
                >
                  Réinitialiser les données initiales
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={settingsSaving}
                  icon={<Save className="h-4 w-4" />}
                >
                  Enregistrer les paramètres
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        open={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        title="Changer le mot de passe"
        maxWidthClass="max-w-[440px]"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPwdModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="pwd-form">
              Mettre à jour
            </Button>
          </>
        }
      >
        <form id="pwd-form" onSubmit={handleChangePassword} className="space-y-4">
          {pwdError && <p className="text-[13px] font-medium text-[#DC2626]">{pwdError}</p>}
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Réinitialiser la base de démonstration ?"
        message="Toutes les modifications locales seront remplacées par le jeu de données initial de la Commune Urbaine d’Antananarivo."
        confirmLabel="Réinitialiser"
        variant="danger"
        onConfirm={async () => {
          await onResetDemo();
          setResetOpen(false);
        }}
      />
    </div>
  );
};
