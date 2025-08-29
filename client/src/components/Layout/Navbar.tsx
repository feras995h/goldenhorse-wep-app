import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings,
  DollarSign,
  ShoppingCart,
  Headphones,
  Truck,
  Home,
  Menu,
  X,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import Logo from '../UI/Logo';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'الرئيسية',
    icon: <Home className="h-5 w-5" />,
    roles: ['admin', 'financial', 'sales', 'customer_service', 'operations']
  },
  {
    path: '/admin',
    label: 'مدير النظام',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin']
  },
  {
    path: '/financial',
    label: 'القسم المالي',
    icon: <DollarSign className="h-5 w-5" />,
    roles: ['financial']
  },
  {
    path: '/sales',
    label: 'المبيعات',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['sales']
  },
  {
    path: '/customer-service',
    label: 'خدمات العملاء',
    icon: <Headphones className="h-5 w-5" />,
    roles: ['customer_service']
  },
  {
    path: '/operations',
    label: 'العمليات',
    icon: <Truck className="h-5 w-5" />,
    roles: ['operations']
  }
];

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role as UserRole)
  );

  return (
    <nav className="bg-gradient-to-r from-golden-600 via-golden-700 to-golden-600 shadow-lg border-b border-golden-500">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center fade-in">
            <div className="flex-shrink-0 flex items-center group">
              <div className="transform group-hover:scale-105 transition-transform duration-200">
                <Logo size="md" showText={false} className="" />
              </div>
              <span className="text-lg font-semibold text-white mr-3">
                لوحة التحكم
              </span>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:block slide-in">
            <div className="flex items-baseline space-x-4 space-x-reverse">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? 'nav-link-active' : 'nav-link-inactive'
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white/80 hover:text-white p-3 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fade-in">
          <div className="px-4 pt-2 pb-3 space-y-2 bg-gradient-to-r from-golden-700 to-golden-800 border-t border-golden-500">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${
                    isActive
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
