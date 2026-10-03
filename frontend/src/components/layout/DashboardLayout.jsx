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
  const isTeacher = user?.role === 'teacher' || location.pathname.startsWith('/teacher');
  const isAdmin = !isSuperAdmin && !isStudent && !isTeacher && (user?.role === 'admin' || location.pathname.startsWith('/admin'));
  const isPearlGlass = isSuperAdmin || isAdmin;
  const sidebarWidth = (isAdmin || isSuperAdmin) ? '265px' : isTeacher ? '245px' : isStudent ? '215px' : 'var(--sa-sidebar-width)';

  return (
    <div
      className={`d-flex min-vh-100 ${isPearlGlass ? 'super-admin-pearl-glass' : 'bg-sa-off-white'}`}
    >
      <div className="d-flex w-100" style={{ minHeight: '100vh' }}>
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          width={sidebarWidth}
          isStudent={isStudent}
          isSuperAdmin={isSuperAdmin}
          isTeacher={isTeacher}
          isAdmin={isAdmin}
        />

        {/* Main Content Area */}
        <div
          className="d-flex flex-column flex-grow-1 min-vw-0"
          id="main-content-wrapper"
          style={{ minWidth: 0, overflowX: 'hidden' }}
        >
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isStudent={isStudent} />

          <main
            className={`flex-grow-1 ${isStudent
                ? 'p-3 p-md-3.5'
                : isTeacher
                  ? 'p-3 p-md-4'
                  : 'p-3 p-sm-4 p-md-4 px-xl-5 py-xl-4'
              }`}
          >
            <div className="w-100" style={{ maxWidth: '1440px', margin: '0 auto' }}>
              <Outlet />
            </div>
          </main>

          {!isTeacher && <Footer />}
        </div>
      </div>
    </div>
  );
}
