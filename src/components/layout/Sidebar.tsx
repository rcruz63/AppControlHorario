// ============================================================
// Sidebar — Navegación principal estilo Flux
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useToast } from '@/components/ui/Toast';
import {
  LayoutDashboard,
  History,
  BarChart3,
  UserCircle,
  LogOut,
  Clock,
  X,
} from 'lucide-react';
import { formatDuration } from '@/lib/calculations';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history', icon: History, label: 'Historial' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/profile', icon: UserCircle, label: 'Perfil' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { signOut } = useAuth();
  const { status, elapsedSeconds } = useTimeTracking();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (status !== 'idle') {
      const confirmed = window.confirm(
        'Tienes una jornada activa. ¿Seguro que deseas cerrar sesión?'
      );
      if (!confirmed) return;
    }

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      showToast('error', 'Error al cerrar sesión');
    }
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-bg-overlay z-[39] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-sidebar
          w-[var(--sidebar-width)] bg-bg-sidebar
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Clock size={22} className="text-text-primary" />
            </div>
            <span className="text-lg font-bold text-text-inverse">
              Control
              <span className="text-primary">Horario</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-text-sidebar hover:text-text-inverse transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-text-primary shadow-sm'
                    : 'text-text-sidebar hover:bg-bg-sidebar-hover hover:text-text-inverse'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Card inferior: estado actual */}
        {status !== 'idle' && (
          <div className="mx-3 mb-3 p-4 rounded-xl bg-bg-sidebar-hover border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-2.5 h-2.5 rounded-full status-pulse ${
                  status === 'working' ? 'bg-success' : 'bg-warning'
                }`}
              />
              <span className="text-xs font-medium text-text-sidebar">
                {status === 'working' ? 'Trabajando' : 'En pausa'}
              </span>
            </div>
            <p className="text-2xl font-bold text-text-inverse timer-display">
              {formatDuration(elapsedSeconds, true)}
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-text-sidebar hover:bg-danger/10 hover:text-danger transition-all cursor-pointer"
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
