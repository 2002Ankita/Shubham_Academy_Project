import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isStudent = user?.role === 'student' || location.pathname.startsWith('/student');
  const isSuperAdmin = user?.role === 'super-admin' || location.pathname.startsWith('/super-admin');
  const sidebarWidth = isSuperAdmin ? '245px' : isStudent ? '215px' : 'var(--sa-sidebar-width)';

  return (
    <div className="d-flex min-vh-100 bg-sa-off-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
        isStudent={isStudent}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Content Area */}
      <div
        className="d-flex flex-column flex-grow-1 min-vw-0"
        id="main-content-wrapper"
        style={{ minWidth: 0 }}
      >
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isStudent={isStudent} />
        
        <main className={`flex-grow-1 ${isStudent ? 'px-3 py-2.5 px-md-3 py-md-2.5' : 'p-3 p-md-4'}`}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
