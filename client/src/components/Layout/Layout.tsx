import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-golden-50 via-white to-golden-100">
      <div className="relative z-10">
        <Navbar />
        <Header />
        <main className="relative">
          <div className="container section-sm">
            <div className="fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
