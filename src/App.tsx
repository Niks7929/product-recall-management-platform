import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthModals } from './components/AuthModals.tsx';
import { RecallDetailsModal } from './components/RecallDetailsModal.tsx';
import { SuperAdminPortal } from './components/portals/SuperAdminPortal.tsx';
import { CompanyPortal } from './components/portals/CompanyPortal.tsx';
import { CustomerPortal } from './components/portals/CustomerPortal.tsx';
import { SupportPortal } from './components/portals/SupportPortal.tsx';
import { RecallRequest } from './types.ts';

const AppContent: React.FC = () => {
  const { user, activeView, setActiveView, loading } = useAuth();
  const [selectedRecall, setSelectedRecall] = useState<RecallRequest | null>(null);

  const handleNavigateSection = (sectionId: string) => {
    setActiveView('landing');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-medium">
        Initializing RecallGuard platform environment...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* 3-Zone Standard Top Navigation */}
      <Navbar onNavigateSection={handleNavigateSection} />

      {/* Main Viewport Routing */}
      {activeView === 'landing' || !user ? (
        <LandingPage onSelectRecall={(recall) => setSelectedRecall(recall)} />
      ) : (
        <>
          {user.role === 'super_admin' && <SuperAdminPortal />}
          {user.role === 'company' && <CompanyPortal />}
          {user.role === 'customer' && <CustomerPortal />}
          {user.role === 'support_staff' && <SupportPortal />}
        </>
      )}

      {/* Recall Details Modal */}
      <RecallDetailsModal
        recall={selectedRecall}
        onClose={() => setSelectedRecall(null)}
      />

      {/* Authentication Modals (Login, Customer Register, Company Register, Super Admin Setup) */}
      <AuthModals />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
