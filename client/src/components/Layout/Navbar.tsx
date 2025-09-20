import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronDown,
  FolderTree,
  Eye,
  FileText,
  TrendingUp,
  Building,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import Logo from '../UI/Logo';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
  children?: NavItem[];
  badge?: string;
  isNew?: boolean;
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
    roles: ['admin'],
    badge: 'جديد'
  },
  {
    path: '/financial',
    label: 'القسم المالي',
    icon: <DollarSign className="h-5 w-5" />,
    roles: ['financial'],
    children: [
      {
        path: '/financial',
        label: 'لوحة التحكم المالية',
        icon: <DollarSign className="h-4 w-4" />,
        roles: ['financial']
      },

      {
        path: '/financial/chart-of-accounts',
        label: 'دليل الحسابات',
        icon: <FolderTree className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/journal',
        label: 'قيود اليومية',
        icon: <Calculator className="h-4 w-4" />,
        roles: ['financial'],
        badge: 'محدث'
      },
      {
        path: '/financial/account-statement',
        label: 'كشف الحساب',
        icon: <Calculator className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/opening-balance',
        label: 'القيد الافتتاحي',
        icon: <TrendingUp className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/account-monitoring',
        label: 'مراقبة الحسابات',
        icon: <Eye className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/customers',
        label: 'إدارة العملاء',
        icon: <Headphones className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/fixed-assets',
        label: 'الأصول الثابتة',
        icon: <Building className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/reports',
        label: 'التقارير المالية',
        icon: <Settings className="h-4 w-4" />,
        roles: ['financial']
      },
      {
        path: '/financial/invoice-reports',
        label: 'تقارير الفواتير',
        icon: <FileText className="h-4 w-4" />,
        roles: ['financial']
      },
          {
            path: '/financial/ar-matching',
            label: 'مطابقة إيصالات القبض',
            icon: <Calculator className="h-4 w-4" />,
            roles: ['financial'],
            isNew: true
          },
          {
            path: '/financial/ar-aging',
            label: 'أعمار الديون',
            icon: <Clock className="h-4 w-4" />,
            roles: ['financial'],
            isNew: true
          },

    ]
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
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [recentPages, setRecentPages] = useState<string[]>([]);

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role as UserRole)
  );

  // Track recent pages
  useEffect(() => {
    if (location.pathname !== '/dashboard') {
      setRecentPages(prev => {
        const newPages = [location.pathname, ...prev.filter(p => p !== location.pathname)];
        return newPages.slice(0, 5);
      });
    }
  }, [location.pathname]);

  const handleDropdownToggle = (itemId: string) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const getPageLabel = (path: string) => {
    const allItems = navItems.flatMap(item =>
      item.children ? [item, ...item.children] : [item]
    );
    const foundItem = allItems.find(item => item.path === path);
    return foundItem?.label || path;
  };

  return (
    <nav className="bg-white border-b border-golden-200 shadow-sm">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center fade-in">
            <div className="flex-shrink-0 flex items-center group">
              <div className="transform group-hover:scale-105 transition-transform duration-200">
                <Logo size="md" showText={false} className="" />
              </div>
              <span className="text-lg font-semibold text-golden-700 mr-3">
                لوحة التحكم
              </span>
            </div>
          </div>

          {/* Navigation Links - Desktop (Simple Navigation) */}
          <div className="hidden lg:block slide-in">
            <div className="flex items-center space-x-2 space-x-reverse">
              {filteredNavItems.map((item) => (
                <div key={item.path} className="relative">
                  {item.children ? (
                    // For items with children, show the main item and first child
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <NavLink
                        to={item.children[0]?.path || item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-200 relative ${
                            isActive
                              ? 'bg-golden-100 text-golden-700 shadow-sm'
                              : 'text-gray-700 hover:text-golden-600 hover:bg-golden-50'
                          }`
                        }
                      >
                        <span>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>

                      {/* Show additional children as separate links */}
                      {item.children.slice(1, 3).map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 relative ${
                              isActive
                                ? 'bg-golden-100 text-golden-700 shadow-sm'
                                : 'text-gray-600 hover:text-golden-600 hover:bg-golden-50'
                            }`
                          }
                        >
                          <span className="text-sm">{child.icon}</span>
                          <span className="text-sm font-medium">{child.label}</span>
                          {child.badge && (
                            <span className="absolute -top-1 -right-1 bg-golden-100 text-golden-700 text-xs px-1.5 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-200 relative ${
                          isActive
                            ? 'bg-golden-100 text-golden-700 shadow-sm'
                            : 'text-gray-700 hover:text-golden-600 hover:bg-golden-50'
                        }`
                      }
                    >
                      <span>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Pages - Desktop */}
          <div className="hidden xl:flex items-center space-x-2 space-x-reverse">
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="h-4 w-4 ml-1" />
              <span>الأخيرة:</span>
            </div>
            {recentPages.slice(0, 3).map((page) => (
              <NavLink
                key={page}
                to={page}
                className="px-2 py-1 text-xs bg-golden-50 hover:bg-golden-100 text-golden-700 rounded transition-colors duration-200"
              >
                {getPageLabel(page)}
              </NavLink>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-golden-600 focus:outline-none focus:text-golden-600 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            {/* Mobile Navigation */}
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
              {filteredNavItems.map((item) => (
                <div key={item.path}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.path)}
                        className="w-full text-right flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:text-golden-600 hover:bg-golden-50 rounded-md transition-colors duration-200"
                      >
                        <span className="flex items-center">
                          <span className="ml-2">{item.icon}</span>
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openDropdown === item.path ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdown === item.path && (
                        <div className="mr-4 mt-2 space-y-1 bg-white rounded-lg p-2 border border-gray-200">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
                                  isActive
                                    ? 'bg-golden-100 text-golden-700'
                                    : 'text-gray-700 hover:text-golden-600 hover:bg-golden-50'
                                }`
                              }
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setOpenDropdown(null);
                              }}
                            >
                              <span className="ml-2">{child.icon}</span>
                              <span className="flex-1">{child.label}</span>
                              {child.badge && (
                                <span className="bg-golden-100 text-golden-700 text-xs px-1.5 py-0.5 rounded-full">
                                  {child.badge}
                                </span>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                          isActive
                            ? 'bg-golden-100 text-golden-700'
                            : 'text-gray-700 hover:text-golden-600 hover:bg-golden-50'
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="flex items-center">
                        <span className="ml-2">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Recent Pages */}
            {recentPages.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <Clock className="h-4 w-4 ml-1" />
                  <span>الصفحات الأخيرة</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentPages.map((page) => (
                    <NavLink
                      key={page}
                      to={page}
                      className="px-2 py-1 text-xs bg-golden-50 hover:bg-golden-100 text-golden-700 rounded transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {getPageLabel(page)}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
