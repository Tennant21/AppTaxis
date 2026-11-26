import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bell,
  Car,
  ChevronDown,
  FileBarChart2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Settings,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type { AppNotification, AppPage, UserAccount } from '../types/taxi';
import { Logo } from './ui/Logo';
import { SearchInput } from './ui/FormControls';
import { formatDateTimeFR } from '../utils/taxiLogic';

interface LayoutProps {
  currentPage: AppPage;
  pageTitle: string;
  breadcrumb?: string;
  user: UserAccount;
  notifications: AppNotification[];
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  onGlobalSearchSubmit: () => void;
  onNavigate: (page: AppPage, taxiId?: string) => void;
  onLogout: () => void;
  onMarkNotificationRead: (id?: string) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  pageTitle,
  breadcrumb,
  user,
  notifications,
  globalSearch,
  onGlobalSearchChange,
  onGlobalSearchSubmit,
  onNavigate,
  onLogout,
  onMarkNotificationRead,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-5 w-5 shrink-0" /> },
    { id: 'taxis', label: 'Taxis', icon: <Car className="h-5 w-5 shrink-0" /> },
    { id: 'drivers', label: 'Chauffeurs', icon: <UserCheck className="h-5 w-5 shrink-0" /> },
    { id: 'owners', label: 'Propriétaires', icon: <Users className="h-5 w-5 shrink-0" /> },
    { id: 'licences', label: 'Licences & autorisations', icon: <Award className="h-5 w-5 shrink-0" /> },
    { id: 'infractions', label: 'Infractions', icon: <AlertTriangle className="h-5 w-5 shrink-0" /> },
    { id: 'scanner', label: 'Scanner & contrôles', icon: <QrCode className="h-5 w-5 shrink-0" /> },
    { id: 'reports', label: 'Rapports & statistiques', icon: <FileBarChart2 className="h-5 w-5 shrink-0" /> },
    { id: 'history', label: 'Historique', icon: <History className="h-5 w-5 shrink-0" /> },
    { id: 'users', label: 'Utilisateurs', icon: <ShieldCheck className="h-5 w-5 shrink-0" /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="h-5 w-5 shrink-0" /> },
  ];

  const isNavActive = (id: AppPage) =>
    currentPage === id || (id === 'taxis' && currentPage === 'taxi-detail');

  const handleNavClick = (id: AppPage) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#172B4D] flex">
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#244D7D] bg-gradient-to-b from-[#123B72] via-[#174EA6] to-[#102F5B] text-white transition-all duration-300 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-3.5 py-4 border-b border-white/15 min-h-[72px]">
          <Logo compact={sidebarCollapsed} inverted className="min-w-0" />
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
            className="hidden md:inline-flex shrink-0 h-8 w-8 items-center justify-center rounded-full text-white/65 hover:bg-white/10 hover:text-white"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navigation principale">
          {navItems.map((item) => {
            const active = isNavActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 rounded-full px-4 py-2.5 text-[14px] font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-[#F4C542] text-[#123B72] font-semibold shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
              >
                {active && !sidebarCollapsed && (
                  <span
                    className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-[#F4C542]"
                    aria-hidden="true"
                  />
                )}
                {item.icon}
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/15 p-3">
          <button
            type="button"
            onClick={onLogout}
            title={sidebarCollapsed ? 'Déconnexion' : undefined}
            className={`w-full flex items-center gap-3 rounded-full px-3 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/45"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-[280px] max-w-[85vw] flex-col bg-white h-full shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#DCE4EF]">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#52627A] hover:bg-[#F7F9FC]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Menu mobile">
              {navItems.map((item) => {
                const active = isNavActive(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 rounded-full px-3 py-3 text-[14px] font-medium ${
                      active
                        ? 'bg-[#F4C542] text-[#123B72] font-semibold shadow-sm'
                        : 'text-[#52627A] hover:bg-[#EAF2FB]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-[#DCE4EF] p-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 rounded-full px-3 py-3 text-[14px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2]"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Déconnexion</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-[68px] bg-white/95 backdrop-blur-xl border-b-[3px] border-b-[#F4C542] shadow-[0_4px_18px_rgba(18,59,114,0.06)] px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-[#172B4D] hover:bg-[#F7F9FC]"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              {breadcrumb && (
                <p className="hidden sm:block text-[12px] font-medium text-[#52627A] truncate">
                  {breadcrumb}
                </p>
              )}
              <h1 className="text-[18px] md:text-[20px] font-semibold text-[#172B4D] truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Global Search */}
            <div className="hidden lg:block w-[280px] xl:w-[320px]">
              <SearchInput
                value={globalSearch}
                onChange={onGlobalSearchChange}
                onSubmit={onGlobalSearchSubmit}
                placeholder="Rechercher un taxi, une immatriculation..."
                ariaLabel="Recherche globale de taxi"
              />
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                aria-label={`Notifications (${unreadCount} non lues)`}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE4EF] bg-white text-[#263B59] hover:bg-[#EAF2FB] hover:text-[#174EA6]"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F4C542] px-1 text-[11px] font-bold text-[#172B4D] tabular-nums border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[320px] sm:w-[360px] rounded-[12px] border border-[#DCE4EF] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden z-40">
                  <div className="flex items-center justify-between border-b border-[#DCE4EF] px-4 py-3">
                    <span className="text-[14px] font-semibold text-[#172B4D]">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => onMarkNotificationRead()}
                        className="text-[12px] font-semibold text-[#174EA6] hover:underline"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[#DCE4EF]">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[13px] text-[#52627A]">
                        Aucune notification.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            setNotifOpen(false);
                            if (n.taxiId) {
                              onNavigate('taxi-detail', n.taxiId);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-[#EAF2FB] transition-colors ${
                            !n.read ? 'bg-[#EAF2FB]/40' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-[#172B4D]">
                              {n.title}
                            </span>
                            <span className="text-[11px] text-[#52627A] tabular-nums">
                              {formatDateTimeFR(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] text-[#52627A] leading-snug">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                aria-label="Menu utilisateur"
                className="inline-flex items-center gap-2 rounded-full border border-[#DCE4EF] bg-white px-2.5 py-1.5 hover:bg-[#EAF2FB] transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#174EA6] text-[12px] font-bold text-white">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-[13px] font-semibold text-[#172B4D] whitespace-nowrap">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-[11px] text-[#52627A] whitespace-nowrap">
                    {user.role === 'ADMINISTRATEUR' ? 'Administrateur' : 'Agent communal'}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-[#52627A]" aria-hidden="true" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-[220px] rounded-[8px] border border-[#DCE4EF] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1 z-40">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#263B59] hover:bg-[#EAF2FB]"
                  >
                    <User className="h-4 w-4 text-[#52627A]" aria-hidden="true" />
                    Mon profil & paramètres
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-[#DC2626] hover:bg-[#FEE2E2]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation (5 items max) */}
        <nav
          className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white border-t-2 border-t-[#F4C542] grid grid-cols-5 h-[62px]"
          aria-label="Navigation inférieure"
        >
          {[
            { id: 'dashboard' as AppPage, label: 'Accueil', icon: <LayoutDashboard className="h-5 w-5" /> },
            { id: 'taxis' as AppPage, label: 'Taxis', icon: <Car className="h-5 w-5" /> },
            { id: 'scanner' as AppPage, label: 'Contrôles', icon: <QrCode className="h-5 w-5" /> },
            { id: 'reports' as AppPage, label: 'Rapports', icon: <FileBarChart2 className="h-5 w-5" /> },
            { id: 'settings' as AppPage, label: 'Profil', icon: <User className="h-5 w-5" /> },
          ].map((tab) => {
            const active = isNavActive(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? 'text-[#174EA6] font-semibold' : 'text-[#52627A]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
