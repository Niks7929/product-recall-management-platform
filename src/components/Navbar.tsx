import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldAlert, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateSection }) => {
  const { user, activeView, setActiveView, setAuthModal, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'company': return 'Manufacturer';
      case 'customer': return 'Consumer';
      case 'support_staff': return 'Safety Staff';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2.5 text-left text-slate-950 font-bold tracking-tight text-xl whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span>RecallGuard</span>
        </button>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => {
              setActiveView('landing');
              onNavigateSection?.('active-recalls');
            }}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Active Recalls
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              onNavigateSection?.('search-recalls');
            }}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Search Registry
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              onNavigateSection?.('how-it-works');
            }}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              onNavigateSection?.('faqs');
            }}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Safety Guidelines
          </button>
          <button
            onClick={() => {
              setActiveView('landing');
              onNavigateSection?.('contact');
            }}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-slate-900 truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-blue-600 font-medium">{getRoleDisplayName(user.role)}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>

                  <div className="py-1">
                    {activeView === 'landing' ? (
                      <button
                        onClick={() => {
                          setActiveView('portal');
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        Open {getRoleDisplayName(user.role)} Portal
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveView('landing');
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                        Return to Public Website
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModal('login')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthModal('register_customer')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
