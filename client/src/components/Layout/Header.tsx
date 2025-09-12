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
import { notificationAPI, formatNotificationTime, type Notification } from '../../services/notificationAPI';

// Remove the local interface since we're importing it from notificationAPI

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

  // Real notifications data
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications
  const loadNotifications = async () => {
    if (isLoadingNotifications) return;

    setIsLoadingNotifications(true);
    try {
      const response = await notificationAPI.getNotifications({
        limit: 20,
        unreadOnly: false
      });

      if (response.success) {
        // Format time for display
        const formattedNotifications = response.data.map(notification => ({
          ...notification,
          time: formatNotificationTime(notification.time)
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Load notifications on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();

      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle notification actions
  const handleMarkAsRead = async (id: string) => {
    const success = await notificationAPI.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await notificationAPI.markAllAsRead();
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const success = await notificationAPI.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleDeleteAllNotifications = async () => {
    const success = await notificationAPI.deleteAllNotifications();
    if (success) {
      setNotifications([]);
    }
  };

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

  // Duplicate functions removed - using real API functions above

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Add dark mode logic here
  };

  return (
    <header className="bg-gradient-to-r from-golden-600 via-golden-700 to-golden-600 border-b-2 border-golden-500 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
          {/* Logo and Title */}
          <div className="flex items-center fade-in flex-shrink-0">
            <div className="flex items-center group">
              <div className="transform group-hover:scale-105 transition-transform duration-200 ml-2 sm:ml-4">
                <Logo size="md" showText={false} className="sm:block" />
              </div>
              <div className="mr-2 sm:mr-4 hidden sm:block">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1">
                  الحصان الذهبي لخدمات الشحن
                </h1>
                <p className="text-xs sm:text-sm text-white/80 flex items-center">
                  <span className="inline-block w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></span>
                  نظام إدارة الشحن من الصين إلى ليبيا
                </p>
              </div>
              {/* Mobile Title */}
              <div className="mr-2 sm:hidden">
                <h1 className="text-base font-bold text-white">
                  الحصان الذهبي
                </h1>
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop Only */}
          <div className="hidden xl:flex flex-1 max-w-md mx-8">
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
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 space-x-reverse slide-in">

            {/* Search Button - Mobile/Tablet */}
            <button
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="xl:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              title="البحث"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Dark Mode Toggle - Hidden on mobile */}
            <button
              onClick={toggleDarkMode}
              className="hidden sm:block p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Help Button - Hidden on mobile */}
            <button
              className="hidden md:block p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
              title="المساعدة"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* Messages - Hidden on mobile */}
            <button
              className="hidden sm:block p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 relative"
              title="الرسائل"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
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
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium min-w-[1rem]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Center - Fixed positioning */}
              {isNotificationsOpen && (
                <NotificationCenter
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDelete={handleDeleteNotification}
                  onDeleteAll={handleDeleteAllNotifications}
                />
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 sm:space-x-3 space-x-reverse bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-2 sm:px-4 py-2 sm:py-3 hover:bg-white/20 transition-colors duration-200"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="text-sm text-right hidden sm:block">
                  <div className="font-semibold text-white">{user?.name}</div>
                  <div className="text-white/70 font-medium text-xs">{getRoleDisplayName(user?.role || '')}</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-white/70 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                  <div className="p-3 sm:p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-golden-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-golden-600" />
                      </div>
                      <div className="mr-3">
                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{getRoleDisplayName(user?.role || '')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    {/* Mobile-only options */}
                    <button
                      onClick={() => {
                        setIsAdvancedSearchOpen(true);
                        setIsProfileOpen(false);
                      }}
                      className="sm:hidden w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                    >
                      <Search className="h-4 w-4 ml-2" />
                      البحث
                    </button>
                    <button className="sm:hidden w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200">
                      <MessageSquare className="h-4 w-4 ml-2" />
                      الرسائل
                      <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium mr-auto">
                        2
                      </span>
                    </button>
                    <button
                      onClick={toggleDarkMode}
                      className="sm:hidden w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                    >
                      {isDarkMode ? <Sun className="h-4 w-4 ml-2" /> : <Moon className="h-4 w-4 ml-2" />}
                      {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                    </button>
                    <div className="sm:hidden border-t border-gray-200 my-2"></div>

                    {/* Common options */}
                    <button className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200">
                      <Settings className="h-4 w-4 ml-2" />
                      إعدادات الحساب
                    </button>
                    <button className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200">
                      <User className="h-4 w-4 ml-2" />
                      الملف الشخصي
                    </button>
                    <button className="md:hidden w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200">
                      <HelpCircle className="h-4 w-4 ml-2" />
                      المساعدة
                    </button>
                  </div>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={logout}
                      className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
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
