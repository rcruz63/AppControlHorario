// ============================================================
// Header — Barra superior con info del usuario
// ============================================================

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { profile } = useAuth();

  const today = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });
  const greeting = getGreeting();

  return (
    <header className="flex items-center justify-between px-6 py-4 lg:px-8">
      {/* Izquierda: hamburger + saludo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu size={22} className="text-text-primary" />
        </button>

        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(profile?.full_name ?? 'U')}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Usuario'}
            </h2>
            <p className="text-xs text-text-secondary">{today}</p>
          </div>
        </div>
      </div>

      {/* Derecha: notificaciones */}
      <div className="flex items-center gap-3">
        <button
          className="relative p-2.5 rounded-xl bg-bg-surface hover:bg-white shadow-sm transition-all cursor-pointer"
          aria-label="Notificaciones"
        >
          <Bell size={18} className="text-text-secondary" />
        </button>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
