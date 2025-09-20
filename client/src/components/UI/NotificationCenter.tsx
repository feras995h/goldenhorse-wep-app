import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter, Clock, Star } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'system' | 'financial' | 'user' | 'security' | 'sales' | 'operations';
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [category, setCategory] = useState<'all' | 'system' | 'financial' | 'user' | 'security' | 'sales' | 'operations'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority'>('time');

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'read') return notification.read;
      return true;
    })
    .filter(notification => {
      if (category === 'all') return true;
      return notification.category === category;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => !n.read && n.priority === 'high').length;

  const getTypeColor = (type: string) => {
    const colors = {
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-500',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      system: <Settings className="h-4 w-4" />,
      financial: <Star className="h-4 w-4" />,
      user: <Bell className="h-4 w-4" />,
      security: <X className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <Bell className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      system: 'النظام',
      financial: 'مالي',
      user: 'المستخدم',
      security: 'الأمان'
    };
    return labels[category as keyof typeof labels] || category;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Notification Panel */}
      <div className="fixed top-16 right-0 md:absolute md:top-full md:right-0 md:mt-2 bg-white rounded-l-xl md:rounded-xl shadow-2xl w-full max-w-sm md:max-w-md h-[calc(100vh-4rem)] md:h-auto md:max-h-[32rem] overflow-hidden z-50 animate-slide-in-right md:animate-fade-in border border-gray-200">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-golden-50 to-golden-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="p-2 bg-golden-200 rounded-lg">
                <Bell className="h-5 w-5 text-golden-700" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">مركز الإشعارات</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {unreadCount} إشعار جديد
                  {highPriorityCount > 0 && (
                    <span className="text-red-600 mr-2 font-medium">({highPriorityCount} مهم)</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-golden-200 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-2 space-x-reverse mb-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">التصفية والترتيب</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
            >
              <option value="all">جميع الإشعارات</option>
              <option value="unread">غير مقروءة</option>
              <option value="read">مقروءة</option>
            </select>
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
            >
              <option value="all">جميع الفئات</option>
              <option value="system">النظام</option>
              <option value="financial">مالي</option>
              <option value="user">المستخدم</option>
              <option value="security">الأمان</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
            >
              <option value="time">ترتيب حسب الوقت</option>
              <option value="priority">ترتيب حسب الأولوية</option>
            </select>

            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-golden-600 hover:text-golden-700 font-medium"
              >
                تحديد الكل كمقروء
              </button>
              <button
                onClick={onDeleteAll}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                حذف الكل
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${getTypeColor(notification.type).split(' ')[0]} shadow-sm`}></div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type)} font-medium`}>
                                {getCategoryLabel(notification.category)}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                {notification.priority === 'high' ? 'مهم' : notification.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-400">
                              <Clock className="h-3 w-3 ml-1" />
                              {notification.time}
                            </div>
                            
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {notification.actionUrl && (
                                <button className="text-xs text-golden-600 hover:text-golden-700 font-medium">
                                  {notification.actionLabel || 'عرض'}
                                </button>
                              )}
                              
                              {!notification.read && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                                  title="تحديد كمقروء"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => onDelete(notification.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                title="حذف"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد إشعارات</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === 'unread' ? 'جميع الإشعارات مقروءة' : 'لا توجد إشعارات في هذه الفئة'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>إجمالي الإشعارات: {notifications.length}</span>
            <span>غير مقروءة: {unreadCount}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
