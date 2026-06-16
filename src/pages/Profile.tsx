// ============================================================
// Profile — Página de perfil de usuario
// ============================================================

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Trash2,
  Shield,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);


  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('warning', 'El nombre no puede estar vacío');
      return;
    }

    setIsUpdatingProfile(true);

    try {
      await updateProfile({ full_name: fullName });
      showToast('success', 'Perfil actualizado');
    } catch {
      showToast('error', 'Error al actualizar perfil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast('warning', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await updatePassword(newPassword);
      showToast('success', 'Contraseña actualizada');

      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showToast('error', 'Error al actualizar contraseña');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y se perderán todos tus datos.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'Esta es tu última oportunidad. ¿Realmente deseas eliminar tu cuenta permanentemente?'
    );

    if (!doubleConfirm) return;

    try {
      // Eliminar datos del usuario (cascade se encarga de pauses y time_entries via profiles FK)
      await supabase.from('time_entries').delete().eq('user_id', user!.id);
      await supabase.from('profiles').delete().eq('id', user!.id);
      await signOut();
      showToast('info', 'Cuenta eliminada. Lamentamos verte ir.');
    } catch {
      showToast('error', 'Error al eliminar cuenta. Contacta soporte.');
    }
  };

  const memberSince = user?.created_at
    ? format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })
    : '';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Perfil</h1>
          <p className="text-text-secondary mt-1">Gestiona tu información personal</p>
        </div>

        {/* Info card */}
        <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-white font-bold text-xl">
              {getInitials(profile?.full_name ?? 'U')}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {profile?.full_name}
              </h2>
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                <Mail size={14} />
                {user?.email}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-tertiary mt-1">
                <Calendar size={12} />
                Miembro desde {memberSince}
              </div>
            </div>
          </div>
        </div>

        {/* Edit profile form */}
        <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">
              Información Personal
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-text-secondary mb-1">
                Nombre completo
              </label>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border text-text-primary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-bg-input border border-border text-text-tertiary cursor-not-allowed"
              />
              <p className="text-xs text-text-tertiary mt-1">
                El email no se puede cambiar desde aquí
              </p>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdatingProfile ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Guardar cambios
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-bg-surface rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">
              Cambiar Contraseña
            </h3>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium text-text-secondary mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-input border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-secondary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-xs font-medium text-text-secondary mb-1">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-input border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-secondary/20 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary-hover text-white font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdatingPassword ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              Actualizar contraseña
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-bg-surface rounded-2xl p-6 shadow-md border border-danger/20">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={18} className="text-danger" />
            <h3 className="text-sm font-semibold text-danger">Zona de Peligro</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Eliminar tu cuenta es permanente e irreversible. Todos tus datos serán borrados.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white font-medium transition-all cursor-pointer"
          >
            <Trash2 size={16} />
            Eliminar mi cuenta
          </button>
        </div>
      </div>
    </Layout>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
