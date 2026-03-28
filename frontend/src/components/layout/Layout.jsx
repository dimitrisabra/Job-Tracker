import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import SiteCredit from '../common/SiteCredit';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/jobs': 'My Applications',
  '/profile': 'Profile Settings',
  '/activity': 'Activity Log',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Manage Users',
  '/admin/jobs': 'All Applications',
  '/admin/postings': 'Job Postings',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'JobTracker';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex-shrink-0 animate-slide-in-left">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open navigation"
          >
            Menu
          </button>
          <h1 className="text-sm font-semibold text-white flex-1 min-w-0 truncate">{pageTitle}</h1>
          <ThemeToggle compact />
        </header>

        <div className="flex-1 overflow-y-auto">
          <main className="p-4 lg:p-6 animate-fade-in">
            <Outlet />
          </main>

          <footer className="border-t border-slate-800 px-4 py-5 lg:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-400">JobTracker (c) 2024</p>
              <SiteCredit className="sm:text-right" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
