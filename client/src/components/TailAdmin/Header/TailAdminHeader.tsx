import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
}

interface TailAdminHeaderProps {
  onMobileMenuToggle: () => void;
  isMobileSidebarOpen: boolean;
}

const TailAdminHeader: React.FC<TailAdminHeaderProps> = ({
  onMobileMenuToggle,
  isMobileSidebarOpen
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Use empty notifications - this component should be replaced with the main Header
  const [notifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Generate breadcrumbs based on current route
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'الرئيسية',
        path: '/dashboard',
        icon: <Home className="h-4 w-4" />
      }
    ];

    const routeMap: Record<string, string> = {
      admin: 'مدير النظام',
      financial: 'القسم المالي',
      sales: 'المبيعات',
      'customer-service': 'خدمات العملاء',
      operations: 'العمليات',
      accounts: 'دليل الحسابات',
      journal: 'قيود اليومية',
      customers: 'إدارة العملاء',

      payroll: 'الموظفين والرواتب',
      'fixed-assets': 'الأصول الثابتة',
      reports: 'التقارير المالية',
      'warehouse-release-orders': 'إيصالات مالية'
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      if (routeMap[segment]) {
        breadcrumbs.push({
          label: routeMap[segment],
          path: index === pathSegments.length - 1 ? undefined : currentPath
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

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

  const getNotificationColor = (type: string) => {
    const colors = {
      info: 'text-blue-600 bg-blue-100',
      success: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-golden-200 shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        {/* Left Section - Mobile Menu + Breadcrumbs */}
        <div className="flex items-center flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-dark-600 hover:text-golden-600 hover:bg-golden-50 rounded-lg transition-colors duration-200 ml-3"
          >
            {isMobileSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center space-x-2 space-x-reverse">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-dark-400 mx-2" />
                )}
                {item.path ? (
                  <Link
                    to={item.path}
                    className="flex items-center text-sm font-medium text-dark-600 hover:text-golden-600 transition-colors duration-200"
                  >
                    {item.icon && <span className="ml-1">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span className="flex items-center text-sm font-medium text-golden-600">
                    {item.icon && <span className="ml-1">{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Center Section - Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-dark-400" />
            </div>
            <input
              type="text"
              placeholder="البحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-golden-200 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-transparent text-sm text-dark-900 placeholder-dark-500"
            />
          </div>
        </div>

        {/* Right Section - Notifications + Profile */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-dark-600 hover:text-golden-600 hover:bg-golden-50 rounded-lg transition-colors duration-200"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white border border-golden-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-golden-200">
                  <h3 className="text-sm font-semibold text-dark-800">الإشعارات</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-golden-50 transition-colors duration-200 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`p-1 rounded-full ${getNotificationColor(notification.type)} ml-3 mt-1`}>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-800 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-dark-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-dark-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-golden-200">
                  <button className="text-sm text-golden-600 hover:text-golden-700 font-medium">
                    عرض جميع الإشعارات
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 space-x-reverse p-2 text-dark-600 hover:text-golden-600 hover:bg-golden-50 rounded-lg transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-golden-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-golden-600" />
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-dark-800">{user?.name}</p>
                <p className="text-xs text-dark-600">{getRoleDisplayName(user?.role || '')}</p>
              </div>
              <ChevronDown className="h-4 w-4 hidden md:block" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-golden-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-4 py-2 border-b border-golden-200">
                  <p className="text-sm font-medium text-dark-800">{user?.name}</p>
                  <p className="text-xs text-dark-600">{getRoleDisplayName(user?.role || '')}</p>
                </div>
                <button className="w-full px-4 py-2 text-right text-sm text-dark-600 hover:bg-golden-50 hover:text-golden-600 transition-colors duration-200 flex items-center">
                  <Settings className="h-4 w-4 ml-3" />
                  <span>الإعدادات</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-right text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-200 flex items-center"
                >
                  <LogOut className="h-4 w-4 ml-3" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-dark-400" />
          </div>
          <input
            type="text"
            placeholder="البحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-golden-200 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-transparent text-sm text-dark-900 placeholder-dark-500"
          />
        </div>
      </div>
    </header>
  );
};

export default TailAdminHeader;