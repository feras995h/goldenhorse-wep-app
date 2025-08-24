import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../UI/Logo';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'مدير النظام',
      financial: 'القسم المالي',
      sales: 'المبيعات',
      customer_service: 'خدمات العملاء',
      operations: 'العمليات'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <header className="bg-gradient-to-r from-golden-600 via-golden-700 to-golden-600 border-b-2 border-golden-500 shadow-lg">
      <div className="container">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Title */}
          <div className="flex items-center fade-in">
            <div className="flex items-center group">
              <div className="transform group-hover:scale-105 transition-transform duration-200 ml-4">
                <Logo size="lg" showText={true} />
              </div>
              <div className="mr-4">
                <h1 className="text-2xl font-bold text-white mb-1">
                  الحصان الذهبي لخدمات الشحن
                </h1>
                <p className="text-sm text-white/80 flex items-center">
                  <span className="inline-block w-2 h-2 bg-success-400 rounded-full ml-2"></span>
                  نظام إدارة الشحن من الصين إلى ليبيا
                </p>
              </div>
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center space-x-4 space-x-reverse slide-in">
            {/* User Info Card */}
            <div className="flex items-center space-x-3 space-x-reverse bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-white">{user?.name}</div>
                <div className="text-white/70 font-medium">{getRoleDisplayName(user?.role || '')}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
