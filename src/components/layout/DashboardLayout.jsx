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
  const sidebarWidth = isStudent ? '215px' : 'var(--sa-sidebar-width)';

  return (
    <div className="d-flex min-vh-100 bg-sa-off-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
        isStudent={isStudent}
      />

      {/* Main Container shifted right on desktop */}
      <div
        className="d-flex flex-column flex-grow-1"
        style={{
          marginLeft: '0px',
          width: '100%',
        }}
      >
        <div
          className="d-none d-md-block"
          style={{ width: sidebarWidth, flexShrink: 0 }}
        />
        
        <div
          className="d-flex flex-column flex-grow-1"
          style={{
            marginLeft: sidebarWidth,
          }}
          id="main-content-wrapper"
        >
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isStudent={isStudent} />
          
          <main className={`flex-grow-1 ${isStudent ? 'px-3 py-2.5 px-md-3 py-md-2.5' : 'p-3 p-md-4'}`}>
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
