import React, { useMemo, useState } from 'react';
import { Edit3, Plus, Trash2, Users } from 'lucide-react';
import type { AppDatabase, Owner } from '../types/taxi';
import { formatPhoneMG } from '../utils/taxiLogic';
import { Button, IconButton } from '../components/ui/Button';
import { Input, SearchInput } from '../components/ui/FormControls';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/States';

interface OwnersViewProps {
  db: AppDatabase;
  onCreateOwner: (owner: Partial<Owner>) => Promise<void>;
  onUpdateOwner: (id: string, updates: Partial<Owner>) => Promise<void>;
  onDeleteOwner: (id: string) => Promise<void>;
  onViewTaxi: (taxiId: string) => void;
}

export const OwnersView: React.FC<OwnersViewProps> = ({
  db,
  onCreateOwner,
  onUpdateOwner,
  onDeleteOwner,
  onViewTaxi,
}) => {
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cin, setCin] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.owners.filter((o) => {
      if (!q) return true;
      return (
        o.fullName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.cin.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q)
      );
    });
  }, [db.owners, query]);

  const openAdd = () => {
    setEditing(null);
    setFullName('');
    setPhone('');
    setCin('');
    setAddress('');
    setEmail('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (o: Owner) => {
    setEditing(o);
    setFullName(o.fullName);
    setPhone(o.phone);
    setCin(o.cin);
    setAddress(o.address);
    setEmail(o.email || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setFormError('Ce champ est obligatoire.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        cin: cin.trim() || '101 000 000 000',
        address: address.trim() || 'Antananarivo',
        email: email.trim() || undefined,
      };
      if (editing) {
        await onUpdateOwner(editing.id, payload);
      } else {
        await onCreateOwner(payload);
      }
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#172B4D]">Propriétaires</h2>
          <p className="mt-1 text-[14px] text-[#52627A]">
            Gestion des propriétaires de véhicules et rattachement de flotte.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
          Ajouter un propriétaire
        </Button>
      </div>

      <div className="rounded-[12px] border border-[#DCE4EF] bg-[#E4EEFF] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Rechercher un propriétaire, CIN, téléphone, adresse..."
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Aucun propriétaire trouvé"
          description="Aucun propriétaire ne correspond à votre recherche."
          actionLabel="Réinitialiser"
          onAction={() => setQuery('')}
        />
      ) : (
        <div className="rounded-[12px] border border-[#DCE4EF] bg-[#FFF0A8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF3C4] border-b border-[#DCE4EF] text-[12px] font-semibold text-[#52627A]">
                  <th className="py-3.5 px-5">Propriétaire</th>
                  <th className="py-3.5 px-4">Téléphone</th>
                  <th className="py-3.5 px-4">CIN</th>
                  <th className="py-3.5 px-4">Taxis rattachés</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE4EF] text-[14px]">
                {filtered.map((o) => {
                  const ownedTaxis = db.taxis.filter((t) => t.ownerId === o.id);
                  return (
                    <tr key={o.id} className="h-[58px] hover:bg-[#D8E7FF]/55 transition-colors">
                      <td className="px-5">
                        <div className="font-semibold text-[#172B4D]">{o.fullName}</div>
                        <div className="text-[12px] text-[#52627A]">{o.address}</div>
                      </td>
                      <td className="px-4 tabular-nums text-[#263B59] whitespace-nowrap">
                        {formatPhoneMG(o.phone)}
                      </td>
                      <td className="px-4 tabular-nums text-[#52627A] whitespace-nowrap">
                        {o.cin}
                      </td>
                      <td className="px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ownedTaxis.length === 0 ? (
                            <span className="text-[12px] text-[#8290A5]">Aucun véhicule</span>
                          ) : (
                            ownedTaxis.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => onViewTaxi(t.id)}
                                className="plate-badge rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-2.5 py-0.5 text-[12px] text-[#174EA6] hover:border-[#174EA6]"
                              >
                                {t.plate}
                              </button>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <IconButton label={`Modifier ${o.fullName}`} onClick={() => openEdit(o)}>
                            <Edit3 className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label={`Supprimer ${o.fullName}`}
                            variant="danger"
                            onClick={() => setDeleteTarget(o)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Modifier ${editing.fullName}` : 'Ajouter un propriétaire'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" form="owner-form" loading={loading}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="owner-form" onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-[13px] font-medium text-[#DC2626]">{formError}</p>}
          <Input
            label="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="034 XX XXX XX"
              required
            />
            <Input
              label="N° CIN"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="101 XXX XXX XXX"
            />
          </div>
          <Input
            label="Adresse complète"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Lot, Quartier, Antananarivo 101"
          />
          <Input
            label="Email (optionnel)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer ce propriétaire ?"
        message={`Voulez-vous supprimer définitivement ${deleteTarget?.fullName} ?`}
        confirmLabel="Supprimer"
        variant="danger"
        loading={loading}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setLoading(true);
          try {
            await onDeleteOwner(deleteTarget.id);
            setDeleteTarget(null);
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
};
