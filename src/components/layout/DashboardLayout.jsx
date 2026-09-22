import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100 bg-sa-off-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
          style={{ width: 'var(--sa-sidebar-width)', flexShrink: 0 }}
        />
        
        <div
          className="d-flex flex-column flex-grow-1"
          style={{
            marginLeft: 'var(--sa-sidebar-width)',
          }}
          id="main-content-wrapper"
        >
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-grow-1 p-3 p-md-4">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
