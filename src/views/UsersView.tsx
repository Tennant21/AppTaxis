import React, { useMemo, useState } from 'react';
import { Info, Plus, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
import type { AppDatabase, UserAccount, UserRole, UserStatus } from '../types/taxi';
import { formatDateTimeFR, formatPhoneMG } from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import { Input, SearchInput, Select } from '../components/ui/FormControls';
import { UserStatusBadge } from '../components/ui/Badges';
import { ConfirmDialog, Modal } from '../components/ui/Modal';

interface UsersViewProps {
  db: AppDatabase;
  currentUser: UserAccount;
  onCreateUser: (user: Partial<UserAccount>) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<UserAccount>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  db,
  currentUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const isAdmin = currentUser.role === 'ADMINISTRATEUR';
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('AGENT_COMMUNAL');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.users.filter((u) => {
      if (!q) return true;
      return (
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.badgeNumber.toLowerCase().includes(q)
      );
    });
  }, [db.users, query]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('Ce champ est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      await onCreateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || '034 00 000 00',
        role,
        status: 'ACTIF',
        badgeNumber: badgeNumber.trim() || undefined,
      });
      setModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setBadgeNumber('');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (u: UserAccount) => {
    const next: UserStatus = u.status === 'ACTIF' ? 'DESACTIVE' : 'ACTIF';
    await onUpdateUser(u.id, { status: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Utilisateurs</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Administration des comptes administrateurs et agents communaux de la CUA.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setFormError('');
              setModalOpen(true);
            }}
          >
            Ajouter un utilisateur
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-3 rounded-[12px] border border-[#BFDBFE] bg-[#DBEAFE] p-4 text-[13px] text-[#1E3A8A]">
          <Info className="h-5 w-5 shrink-0 text-[#2563EB]" aria-hidden="true" />
          <div>
            <p className="font-semibold">Consultation uniquement</p>
            <p className="mt-0.5">
              Votre rôle d’Agent communal permet de consulter l’annuaire. La création ou désactivation de comptes est réservée à l’Administrateur.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-[12px] border border-[#DCE4EF] bg-white p-4 shadow-[0_3px_12px_rgba(18,59,114,0.06)]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Rechercher par nom, email, matricule..."
        />
      </div>

      <div className="rounded-[12px] border border-[#DCE4EF] bg-white shadow-[0_3px_12px_rgba(18,59,114,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F9FC] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                <th className="py-3.5 px-5">Nom</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Rôle</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4">Dernière connexion</th>
                {isAdmin && <th className="py-3.5 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
              {filtered.map((u) => (
                <tr key={u.id} className="h-[58px] hover:bg-white/55 transition-colors">
                  <td className="px-5">
                    <div className="font-semibold text-[#172B4D]">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-[12px] text-[#52627A] tabular-nums">
                      {u.badgeNumber} · {formatPhoneMG(u.phone)}
                    </div>
                  </td>
                  <td className="px-4 text-[#263B59] whitespace-nowrap">{u.email}</td>
                  <td className="px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#123B72]">
                      <ShieldCheck className="h-4 w-4 text-[#174EA6]" aria-hidden="true" />
                      {u.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Agent communal'}
                    </span>
                  </td>
                  <td className="px-4 whitespace-nowrap">
                    <UserStatusBadge status={u.status} />
                  </td>
                  <td className="px-4 text-[13px] text-[#52627A] tabular-nums whitespace-nowrap">
                    {formatDateTimeFR(u.lastLogin)}
                  </td>
                  {isAdmin && (
                    <td className="px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <IconButton
                          label={u.status === 'ACTIF' ? 'Désactiver le compte' : 'Activer le compte'}
                          disabled={u.id === currentUser.id}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status === 'ACTIF' ? (
                            <UserX className="h-4 w-4 text-[#D97706]" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-[#16A34A]" />
                          )}
                        </IconButton>
                        <IconButton
                          label={`Supprimer ${u.firstName} ${u.lastName}`}
                          variant="danger"
                          disabled={u.id === currentUser.id}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Créer un compte utilisateur"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="user-form" loading={loading}>
              Créer le compte
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-[13px] font-medium text-[#DC2626]">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            label="Email professionnel"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@cua-taxis.mg"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="034 XX XXX XX"
            />
            <Input
              label="Matricule"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              placeholder="AGT-012"
            />
          </div>
          <Select
            label="Rôle"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={[
              { value: 'AGENT_COMMUNAL', label: 'Agent communal' },
              { value: 'ADMINISTRATEUR', label: 'Administrateur' },
            ]}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer ce compte utilisateur ?"
        message={`Voulez-vous supprimer définitivement l'accès de ${deleteTarget?.firstName} ${deleteTarget?.lastName} ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setLoading(true);
          try {
            await onDeleteUser(deleteTarget.id);
            setDeleteTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
};
