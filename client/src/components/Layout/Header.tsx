import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  User, 
  Bell, 
  Search, 
  Settings, 
  ChevronDown, 
  Sun,
  Moon,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../UI/Logo';
import AdvancedSearch from '../UI/AdvancedSearch';
import NotificationCenter from '../UI/NotificationCenter';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'system' | 'financial' | 'user' | 'security';
  actionUrl?: string;
  actionLabel?: string;
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'قيد جديد',
      message: 'تم إنشاء قيد يومية جديد بقيمة 15,000 د.ل',
      time: 'منذ 5 دقائق',
      type: 'info',
      read: false,
      priority: 'medium',
      category: 'financial'
    },
    {
      id: '2',
      title: 'عميل جديد',
      message: 'انضم عميل جديد: شركة التجارة الدولية',
      time: 'منذ ساعة',
      type: 'success',
      read: false,
      priority: 'low',
      category: 'user'
    },
    {
      id: '3',
      title: 'تحذير مالي',
      message: 'انتباه: رصيد الحساب منخفض',
      time: 'منذ ساعتين',
      type: 'warning',
      read: true,
      priority: 'high',
      category: 'financial'
    },
    {
      id: '4',
      title: 'تحديث النظام',
      message: 'تم تحديث النظام إلى الإصدار الجديد',
      time: 'منذ 3 ساعات',
      type: 'info',
      read: false,
      priority: 'medium',
      category: 'system'
    },
    {
      id: '5',
      title: 'محاولة تسجيل دخول فاشلة',
      message: 'تم رصد محاولة تسجيل دخول من IP غير معروف',
      time: 'منذ 4 ساعات',
      type: 'error',
      read: false,
      priority: 'high',
      category: 'security'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'مدير النظام',
      financial: 'مدير القسم المالي',
      sales: 'مدير المبيعات',
      customer_service: 'مدير خدمة العملاء',
      operations: 'مدير العمليات'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  // Function to get notification color (kept for future use)
  // const getNotificationColor = (type: string) => {
  //   const colors = {
  //     info: 'text-blue-500',
  //     success: 'text-green-500',
  //     warning: 'text-yellow-500',
  //     error: 'text-red-500'
  //   };
  //   return colors[type as keyof typeof colors] || colors.info;
  // };

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdvancedSearchOpen(true);
  };

  const handleAdvancedSearchResult = (result: any) => {
    setIsAdvancedSearchOpen(false);
    navigate(result.path);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleDeleteAllNotifications = () => {
    setNotifications([]);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Add dark mode logic here
  };

  return (
    <header className="bg-gradient-to-r from-golden-600 via-golden-700 to-golden-600 border-b-2 border-golden-500 shadow-lg sticky top-0 z-50">
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
                  <span className="inline-block w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></span>
                  نظام إدارة الشحن من الصين إلى ليبيا
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white/70" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pr-10 pl-3 py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 sm:text-sm"
                  placeholder="البحث في النظام... (اضغط Enter للبحث المتقدم)"
                />
              </div>
            </form>
          </div>

          {/* Right Section - Actions and User */}
          <div className="flex items-center space-x-4 space-x-reverse slide-in">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Help Button */}
            <button
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              title="المساعدة"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* Messages */}
            <button
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 relative"
              title="الرسائل"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 relative"
                title="الإشعارات"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Center */}
              <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDelete={handleDeleteNotification}
                onDeleteAll={handleDeleteAllNotifications}
              />
            </div>

            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 space-x-reverse bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 hover:bg-white/20 transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-sm text-right">
                  <div className="font-semibold text-white">{user?.name}</div>
                  <div className="text-white/70 font-medium">{getRoleDisplayName(user?.role || '')}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-golden-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-golden-600" />
                      </div>
                      <div className="mr-3">
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-500">{getRoleDisplayName(user?.role || '')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                      <Settings className="h-4 w-4 ml-2" />
                      إعدادات الحساب
                    </button>
                    <button className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                      <User className="h-4 w-4 ml-2" />
                      الملف الشخصي
                    </button>
                  </div>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={logout}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearch
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onResultSelect={handleAdvancedSearchResult}
      />
    </header>
  );
};

export default Header;
