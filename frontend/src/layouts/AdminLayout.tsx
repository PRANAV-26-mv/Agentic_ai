import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { AdminSidebar } from '../components/AdminSidebar';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';

export const AdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] flex flex-col relative overflow-x-hidden">
      {/* Apple ambient diffuse glow lights in background */}
      <div className="apple-ambient-glow" />

      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <div className="flex flex-1 relative z-10">
        <AdminSidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden page-enter-animation">
          <Outlet />
        </main>
      </div>
      <PwaInstallPrompt />
    </div>
  );
};
