// ============================================================
// Layout — Layout principal de la app (sidebar + header + contenido)
// ============================================================

import { useState, type ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-main">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal con margen para sidebar en desktop */}
      <div className="lg:ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 pb-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
