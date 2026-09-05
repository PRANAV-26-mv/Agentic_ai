import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { AdminSidebar } from '../components/AdminSidebar';
import { PwaInstallPrompt } from '../components/PwaInstallPrompt';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <PwaInstallPrompt />
    </div>
  );
};
