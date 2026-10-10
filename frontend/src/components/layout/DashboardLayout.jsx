import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const [globalDateFilter, setGlobalDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const isStudent = user?.role === 'student' || location.pathname.startsWith('/student');
  const isSuperAdmin = user?.role === 'super-admin' || location.pathname.startsWith('/super-admin');
  const isTeacher = user?.role === 'teacher' || location.pathname.startsWith('/teacher');
  const isAdmin = !isSuperAdmin && !isStudent && !isTeacher && (user?.role === 'admin' || location.pathname.startsWith('/admin'));
  const isPearlGlass = isSuperAdmin || isAdmin || isStudent || isTeacher;
  const sidebarWidth = (isAdmin || isSuperAdmin || isStudent || isTeacher) ? '265px' : 'var(--sa-sidebar-width)';

  // Corner popup alert if student profile is not 100% complete
  useEffect(() => {
    if (!isStudent) return;

    try {
      const saved = localStorage.getItem('student_profile_data');
      const profile = saved ? JSON.parse(saved) : (user || {});
      const requiredFields = [
        profile?.name,
        profile?.email,
        profile?.phone,
        profile?.avatar,
        profile?.address,
        profile?.parentName,
        profile?.parentPhone
      ];

      // Profile completion check removed as it was erroneously triggering.
    } catch (err) {
      console.warn('Profile check warning:', err);
    }
  }, [isStudent, location.pathname, user]);

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
          <Header 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            globalDateFilter={globalDateFilter} 
            setGlobalDateFilter={setGlobalDateFilter} 
          />

          <main
            className="flex-grow-1 p-3 p-sm-4 p-md-4 px-xl-5 py-xl-4"
          >
            <div className="w-100" style={{ maxWidth: '1440px', margin: '0 auto' }}>
              <Outlet context={{ globalDateFilter, setGlobalDateFilter }} />
            </div>
          </main>

          <Footer isStudent={isStudent || isTeacher} />
        </div>
      </div>
    </div>
  );
}
