// ============================================================
// ForgotPasswordForm — Recuperación de contraseña
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Mail, ArrowLeft, Loader2, Clock, Send } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('warning', 'Introduce tu email');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSent(true);
      showToast('success', 'Email de recuperación enviado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al enviar email';
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
          <h1 className="text-3xl font-bold text-text-primary">Recuperar Contraseña</h1>
          <p className="text-text-secondary mt-2">
            {isSent
              ? 'Revisa tu bandeja de entrada'
              : 'Te enviaremos un enlace de recuperación'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light">
                <Send size={28} className="text-success" />
              </div>
              <p className="text-text-secondary text-sm">
                Hemos enviado un enlace de recuperación a <strong className="text-text-primary">{email}</strong>.
                Revisa también tu carpeta de spam.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-secondary font-semibold hover:text-secondary-hover transition-colors"
              >
                <ArrowLeft size={16} />
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-text-primary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
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
                  <Send size={20} />
                )}
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-secondary transition-colors"
                >
                  <ArrowLeft size={14} />
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
