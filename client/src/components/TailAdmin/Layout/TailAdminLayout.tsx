import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TailAdminSidebar from '../Sidebar/TailAdminSidebar';
import TailAdminHeader from '../Header/TailAdminHeader';

const TailAdminLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-golden-25 flex">
      {/* Desktop Sidebar */}
      <TailAdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        isMobile={false}
      />

      {/* Mobile Sidebar */}
      <TailAdminSidebar
        isCollapsed={false}
        onToggle={() => {}}
        isMobile={true}
        isOpen={isMobileSidebarOpen}
        onClose={handleMobileSidebarClose}
      />

      {/* Main Content Area */}
      <div 
        className={`
          flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-80'}
        `}
      >
        {/* Header */}
        <TailAdminHeader
          onMobileMenuToggle={handleMobileSidebarToggle}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 lg:p-6">
            <div className="max-w-full mx-auto">
              <div className="animate-fade-in">
                <Outlet />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-golden-200 py-4 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-dark-600">
            <div className="flex items-center space-x-4 space-x-reverse mb-2 sm:mb-0">
              <span>© 2024 الحصان الذهبي لخدمات الشحن</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">جميع الحقوق محفوظة</span>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-xs">الإصدار 2.0</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success-500 rounded-full ml-2"></div>
                <span className="text-xs">النظام يعمل</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TailAdminLayout;