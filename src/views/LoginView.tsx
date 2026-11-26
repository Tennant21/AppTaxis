import React, { useState } from 'react';
import { Lock, Mail, Shield, UserCheck } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('agent01@cua-taxis.mg');
  const [password, setPassword] = useState('CuaTaxi2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Veuillez saisir votre identifiant et votre mot de passe.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[1040px] rounded-[16px] border border-[#DCE4EF] bg-[#E4EEFF] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Form Column */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="py-2">
              <Logo />
            </div>

            <div className="mt-8">
              <h1 className="text-[28px] sm:text-[32px] font-bold text-[#172B4D] leading-tight">
                Gestion des taxis
              </h1>
              <p className="mt-2 text-[14px] text-[#52627A]">
                Portail administratif de centralisation et de contrôle réglementaire — Commune Urbaine d’Antananarivo.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-[8px] border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-[13px] font-medium text-[#DC2626]"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                id="login-email"
                label="Email / identifiant"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex. agent01@cua-taxis.mg"
                required
              />

              <Input
                id="login-password"
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setForgotEmail(email);
                    setForgotOpen(true);
                  }}
                  className="text-[13px] font-semibold text-[#174EA6] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                icon={<Lock className="h-4 w-4" />}
              >
                Se connecter
              </Button>
            </form>

            {/* Institutional Role Switcher for Quick Verification */}
            <div className="mt-8 pt-6 border-t border-[#DCE4EF]">
              <p className="text-[12px] font-semibold text-[#52627A] mb-3">
                Comptes de démonstration habilités :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@cua-taxis.mg');
                    setPassword('CuaTaxi2026!');
                    onLogin('admin@cua-taxis.mg', 'CuaTaxi2026!');
                  }}
                  className="flex items-center gap-2.5 rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-4 py-2.5 text-left hover:bg-[#D8E7FF] hover:border-[#174EA6] transition-colors"
                >
                  <Shield className="h-4 w-4 text-[#174EA6] shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#172B4D]">Administrateur</div>
                    <div className="text-[11px] text-[#52627A] truncate">admin@cua-taxis.mg</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('agent01@cua-taxis.mg');
                    setPassword('CuaTaxi2026!');
                    onLogin('agent01@cua-taxis.mg', 'CuaTaxi2026!');
                  }}
                  className="flex items-center gap-2.5 rounded-full border border-[#DCE4EF] bg-[#FFF3C4] px-4 py-2.5 text-left hover:bg-[#D8E7FF] hover:border-[#174EA6] transition-colors"
                >
                  <UserCheck className="h-4 w-4 text-[#123B72] shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#172B4D]">Agent communal</div>
                    <div className="text-[11px] text-[#52627A] truncate">agent01@cua-taxis.mg</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-[12px] text-[#52627A]">
            Direction des Transports et de la Mobilité Urbaine — Analakely, Antananarivo 101
          </p>
        </div>

        {/* Institutional Visual Block */}
        <div className="hidden lg:block lg:col-span-6 relative bg-[#123B72] min-h-[580px]">
          {!imgFailed ? (
            <img
              src="/src/assets/images/login_antananarivo_taxi_1795603991203.jpg"
              alt="Taxis devant l’Hôtel de Ville d’Antananarivo"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-10 text-white">
              <Logo inverted />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-[6px] bg-[#F4C542] px-2.5 py-1 text-[12px] font-bold text-[#172B4D]">
              CUA · Mobilité Urbaine
            </div>
            <h2 className="mt-3 text-[20px] font-bold leading-snug">
              Contrôle et régulation du transport urbain à Antananarivo
            </h2>
            <p className="mt-1.5 text-[13px] text-white/85">
              Suivi unifié des licences municipales, dossiers chauffeurs, propriétaires et vérifications terrain.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Réinitialisation du mot de passe"
        description="Saisissez votre adresse email professionnelle pour recevoir un lien de réinitialisation."
        maxWidthClass="max-w-[440px]"
        footer={
          forgotSent ? (
            <Button variant="primary" onClick={() => setForgotOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setForgotOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                icon={<Mail className="h-4 w-4" />}
                onClick={() => setForgotSent(true)}
                disabled={!forgotEmail.trim()}
              >
                Envoyer la demande
              </Button>
            </>
          )
        }
      >
        {forgotSent ? (
          <div className="rounded-[8px] border border-[#BBF7D0] bg-[#DCFCE7] p-4 text-[13px] text-[#16A34A] font-medium">
            Une demande de réinitialisation a été transmise au support informatique de la Commune Urbaine d’Antananarivo pour {forgotEmail}.
          </div>
        ) : (
          <Input
            id="forgot-email"
            label="Email professionnel"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="prenom.nom@cua-taxis.mg"
            required
          />
        )}
      </Modal>
    </div>
  );
};
