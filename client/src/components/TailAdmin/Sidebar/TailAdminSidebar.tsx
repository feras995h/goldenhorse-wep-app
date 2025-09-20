import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Settings,
  DollarSign,
  ShoppingCart,
  Headphones,
  Truck,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building,
  ChevronDown,
  ChevronUp,
  Calculator,
  Trees,
  Eye,
  FileText,
  TrendingUp,
  Users,
  Package,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth';
import Logo from '../../UI/Logo';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles: UserRole[];
  children?: NavigationItem[];
  badge?: string;
}

interface TailAdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'الرئيسية',
    icon: <Home className="h-5 w-5" />,
    roles: ['admin', 'financial', 'sales', 'customer_service', 'operations']
  },
  {
    id: 'admin',
    path: '/admin',
    label: 'مدير النظام',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin']
  },
  {
    id: 'financial',
    label: 'القسم المالي',
    icon: <DollarSign className="h-5 w-5" />,
    roles: ['admin', 'financial'],
    children: [
      {
        id: 'financial-dashboard',
        path: '/financial',
        label: 'لوحة التحكم المالية',
        icon: <DollarSign className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },

      {
        id: 'financial-chart-of-accounts',
        path: '/financial/chart-of-accounts',
        label: 'دليل الحسابات',
        icon: <Trees className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-journal',
        path: '/financial/journal',
        label: 'قيود اليومية',
        icon: <Calculator className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-account-statement',
        path: '/financial/account-statement',
        label: 'كشف الحساب',
        icon: <Calculator className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-opening-balance',
        path: '/financial/opening-balance',
        label: 'القيد الافتتاحي',
        icon: <TrendingUp className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-account-monitoring',
        path: '/financial/account-monitoring',
        label: 'مراقبة الحسابات',
        icon: <Eye className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-customers',
        path: '/financial/customers',
        label: 'متابعة العملاء',
        icon: <Users className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },

      {
        id: 'financial-payroll',
        path: '/financial/payroll',
        label: 'الموظفين والرواتب',
        icon: <Settings className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-assets',
        path: '/financial/fixed-assets',
        label: 'الأصول الثابتة',
        icon: <Building className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-reports',
        path: '/financial/reports',
        label: 'التقارير المالية',
        icon: <Settings className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
      {
        id: 'financial-invoice-reports',
        path: '/financial/invoice-reports',
        label: 'تقارير الفواتير',
        icon: <FileText className="h-4 w-4" />,
        roles: ['admin', 'financial']
      },
    ]
  },
  {
    id: 'sales',
    label: 'المبيعات',
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ['admin', 'sales'],
    children: [
      {
        id: 'sales-dashboard',
        path: '/sales',
        label: 'لوحة المبيعات',
        icon: <TrendingUp className="h-4 w-4" />,
        roles: ['admin', 'sales']
      },
      {
        id: 'sales-inventory',
        path: '/sales/inventory',
        label: 'إدارة الشحنات',
        icon: <Truck className="h-4 w-4" />,
        roles: ['admin', 'sales']
      },
      {
        id: 'warehouse-release-orders',
        path: '/sales/warehouse-release-orders',
        label: 'إيصالات مالية',
        icon: <FileText className="h-4 w-4" />,
        roles: ['admin', 'financial', 'sales']
      },
      {
        id: 'sales-customers',
        path: '/sales/customers',
        label: 'إدارة العملاء',
        icon: <Users className="h-4 w-4" />,
        roles: ['admin', 'sales']
      },
      {
        id: 'shipping-invoices',
        path: '/sales/shipping-invoices',
        label: 'فواتير الشحن',
        icon: <Package className="h-4 w-4" />,
        roles: ['admin', 'sales']
      },
      {
        id: 'sales-invoices',
        path: '/sales/sales-invoices',
        label: 'فواتير المبيعات',
        icon: <FileText className="h-4 w-4" />,
        roles: ['admin', 'sales']
      },
    ]
  },

];

const TailAdminSidebar: React.FC<TailAdminSidebarProps> = ({
  isCollapsed,
  onToggle,
  isMobile = false,
  isOpen = false,
  onClose
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['financial']);

  const filteredNavItems = navigationItems.filter(item => {
    // For admin users, exclude the dashboard (الرئيسية) item
    if (user?.role === 'admin' && item.id === 'dashboard') {
      return false;
    }
    return item.roles.includes(user?.role as UserRole);
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveItem = (item: NavigationItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some(child => child.path === location.pathname);
    }
    return false;
  };

  const isActiveChild = (childPath: string): boolean => {
    return location.pathname === childPath;
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isActiveItem(item);

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`
              w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-golden-100 text-golden-800 border-r-4 border-golden-600' 
                : 'text-dark-600 hover:bg-golden-50 hover:text-golden-700'
              }
              ${isCollapsed ? 'px-3' : 'px-4'}
            `}
          >
            <div className="flex items-center">
              <span className={`${isCollapsed ? 'ml-0' : 'ml-3'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="mr-3 whitespace-nowrap">{item.label}</span>
              )}
            </div>
            {!isCollapsed && (
              <span className="transition-transform duration-200">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </span>
            )}
          </button>

          {/* Submenu */}
          {!isCollapsed && isExpanded && item.children && (
            <div className="mr-4 space-y-1 animate-fade-in">
              {item.children.map(child => (
                <NavLink
                  key={child.id}
                  to={child.path || '#'}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `
                    flex items-center px-6 py-2 text-sm rounded-lg transition-all duration-200
                    ${isActive || isActiveChild(child.path || '')
                      ? 'bg-golden-500 text-white shadow-md'
                      : 'text-dark-600 hover:bg-golden-100 hover:text-golden-700'
                    }
                    `
                  }
                >
                  <span className="ml-3">{child.icon}</span>
                  <span className="mr-3 whitespace-nowrap">{child.label}</span>
                  {child.badge && (
                    <span className="mr-auto bg-danger-500 text-white text-xs px-2 py-1 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.id}
        to={item.path || '#'}
        onClick={isMobile ? onClose : undefined}
        className={({ isActive }) =>
          `
          flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
          ${isActive
            ? 'bg-golden-100 text-golden-800 border-r-4 border-golden-600'
            : 'text-dark-600 hover:bg-golden-50 hover:text-golden-700'
          }
          ${isCollapsed ? 'px-3 justify-center' : 'px-4'}
          `
        }
      >
        <span className={`${isCollapsed ? 'ml-0' : 'ml-3'}`}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="mr-3 whitespace-nowrap">{item.label}</span>
            {item.badge && (
              <span className="mr-auto bg-danger-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={`px-4 py-6 border-b border-golden-200 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Logo size={isCollapsed ? "sm" : "md"} showText={false} />
          </div>
          {!isCollapsed && (
            <div className="mr-3 min-w-0">
              <h2 className="text-lg font-bold text-dark-800 truncate">
                الحصان الذهبي
              </h2>
              <p className="text-xs text-dark-600 truncate">
                نظام إدارة الشحن
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavItems.map(renderNavigationItem)}
      </div>

      {/* Collapse Toggle - Desktop Only */}
      {!isMobile && (
        <div className="p-4 border-t border-golden-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-dark-600 bg-golden-50 hover:bg-golden-100 rounded-lg transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 ml-2" />
                <span>طي القائمة</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-dark-900/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`
            fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-golden-200">
            <div className="flex items-center">
              <Logo size="sm" showText={false} />
              <h2 className="mr-3 text-lg font-bold text-dark-800">
                القائمة الرئيسية
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-dark-400 hover:text-dark-600 hover:bg-golden-50 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavItems.map(renderNavigationItem)}
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div
      className={`
        hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 lg:z-30
        bg-white border-l border-golden-200 shadow-lg transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-20' : 'lg:w-80'}
      `}
    >
      {sidebarContent}
    </div>
  );
};

export default TailAdminSidebar;