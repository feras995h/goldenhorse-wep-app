import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  MoreVertical,
  X,
  Eye,
  Archive
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'system' | 'financial' | 'sales' | 'user' | 'security';
  actionUrl?: string;
  actionText?: string;
}

interface AdminNotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onArchive?: (id: string) => void;
  onAction?: (notification: Notification) => void;
  loading?: boolean;
}

const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onAction,
  loading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    const opacity = read ? '50' : '100';
    switch (type) {
      case 'success':
        return `bg-green-${opacity} border-green-200`;
      case 'warning':
        return `bg-yellow-${opacity} border-yellow-200`;
      case 'error':
        return `bg-red-${opacity} border-red-200`;
      default:
        return `bg-blue-${opacity} border-blue-200`;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      system: { label: 'نظام', color: 'bg-purple-100 text-purple-800' },
      financial: { label: 'مالي', color: 'bg-green-100 text-green-800' },
      sales: { label: 'مبيعات', color: 'bg-blue-100 text-blue-800' },
      user: { label: 'مستخدم', color: 'bg-indigo-100 text-indigo-800' },
      security: { label: 'أمان', color: 'bg-red-100 text-red-800' }
    };
    return categoryMap[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'الآن';
    } else if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `منذ ${hours} ساعة`;
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'high' && notification.priority !== 'high') return false;
    if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-gray-600 ml-3" />
            <h3 className="text-lg font-semibold text-gray-900">مركز الإشعارات</h3>
            {unreadCount > 0 && (
              <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount} جديد
              </span>
            )}
          </div>
          {onMarkAllAsRead && unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الإشعارات</option>
              <option value="unread">غير مقروءة</option>
              <option value="high">عالية الأولوية</option>
            </select>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع الفئات</option>
            <option value="system">نظام</option>
            <option value="financial">مالي</option>
            <option value="sales">مبيعات</option>
            <option value="user">مستخدم</option>
            <option value="security">أمان</option>
          </select>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const categoryInfo = getCategoryBadge(notification.category);
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(notification.priority)}`}>
                            {notification.priority === 'high' ? 'عالي' : 
                             notification.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      } mb-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 ml-1" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {notification.actionUrl && notification.actionText && onAction && (
                            <button
                              onClick={() => onAction(notification)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {notification.actionText}
                            </button>
                          )}
                          
                          {!notification.read && onMarkAsRead && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="text-xs text-gray-600 hover:text-gray-800"
                              title="تحديد كمقروء"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          )}
                          
                          {onArchive && (
                            <button
                              onClick={() => onArchive(notification.id)}
                              className="text-xs text-gray-600 hover:text-gray-800"
                              title="أرشفة"
                            >
                              <Archive className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationCenter;
