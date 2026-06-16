// ============================================================
// ResetPasswordForm — Restablecer contraseña tras recuperación
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Lock, ArrowLeft, Loader2, Clock, CheckCircle } from 'lucide-react';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      showToast('warning', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setIsSuccess(true);
      showToast('success', 'Contraseña restablecida correctamente');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar la contraseña';
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Clock size={32} className="text-text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Nueva Contraseña</h1>
          <p className="text-text-secondary mt-2">
            {isSuccess
              ? 'Cambio completado'
              : 'Escribe tu nueva contraseña de acceso'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light">
                <CheckCircle size={28} className="text-success" />
              </div>
              <p className="text-text-secondary text-sm">
                Tu contraseña ha sido restablecida con éxito. Serás redireccionado al login en unos segundos...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-secondary font-semibold hover:text-secondary-hover transition-colors"
              >
                <ArrowLeft size={16} />
                Ir al login ahora
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-text-primary mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-input border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-secondary/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-reset-password" className="block text-sm font-medium text-text-primary mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    id="confirm-reset-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-bg-input border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-secondary/20 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-text-primary font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Lock size={20} />
                )}
                {isLoading ? 'Guardando...' : 'Restablecer contraseña'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-secondary transition-colors"
                >
                  <ArrowLeft size={14} />
                  Cancelar y volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
