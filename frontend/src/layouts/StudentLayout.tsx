import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { StudentSidebar } from '../components/StudentSidebar';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';
import { LiquidCanvas } from '../components/LiquidCanvas';

export const StudentLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50/60 text-[#1d1d1f] flex flex-col relative overflow-x-hidden">
      {/* Liquid Glass ambient canvas with luminous animated orbs */}
      <LiquidCanvas />

      <Header
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <div className="flex flex-1 relative z-10 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 gap-3 sm:gap-6">
        <StudentSidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 py-2 sm:py-3 w-full overflow-x-hidden page-enter-animation min-w-0">
          <Outlet />
        </main>
      </div>
      <PwaInstallPrompt />
    </div>
  );
};
