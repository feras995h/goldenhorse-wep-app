import React from 'react';
import { Server, Users, Shield, Activity, Clock, HardDrive, Cpu, AlertCircle } from 'lucide-react';
import TailAdminDashboardCard from '../TailAdmin/Cards/TailAdminDashboardCard';

interface SystemData {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  roles: {
    total: number;
  };
  health: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      heapUsed: number;
      heapTotal: number;
    };
    version: string;
    status: string;
  };
}

interface Activity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

interface AdminSystemMetricsProps {
  systemData: SystemData;
  activities: Activity[];
  alerts: Alert[];
  loading?: boolean;
}

const AdminSystemMetrics: React.FC<AdminSystemMetricsProps> = ({
  systemData,
  activities,
  alerts,
  loading = false
}) => {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} يوم، ${hours} ساعة`;
    } else if (hours > 0) {
      return `${hours} ساعة، ${minutes} دقيقة`;
    } else {
      return `${minutes} دقيقة`;
    }
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TailAdminDashboardCard
          title="المستخدمين النشطين"
          value={systemData.users.active}
          icon={Users}
          color="success"
          trend={{
            direction: 'up',
            percentage: ((systemData.users.active / systemData.users.total) * 100),
            period: `من إجمالي ${systemData.users.total}`
          }}
        />
        
        <TailAdminDashboardCard
          title="الأدوار المُعرَّفة"
          value={systemData.roles.total}
          icon={Shield}
          color="primary"
        />
        
        <TailAdminDashboardCard
          title="وقت التشغيل"
          value={formatUptime(systemData.health.uptime)}
          icon={Clock}
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Details */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Server className="h-6 w-6 text-gray-600 ml-3" />
              حالة النظام
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">حالة الخادم</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  systemData.health.status === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {systemData.health.status === 'healthy' ? 'سليم' : 'يحتاج انتباه'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">إصدار Node.js</span>
                <span className="text-sm font-medium text-gray-900">{systemData.health.version}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <HardDrive className="h-4 w-4 ml-1" />
                    استخدام الذاكرة
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatMemory(systemData.health.memory.heapUsed)} / {formatMemory(systemData.health.memory.heapTotal)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(systemData.health.memory.heapUsed / systemData.health.memory.heapTotal) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-6 w-6 text-gray-600 ml-3" />
              النشاطات الأخيرة
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500">{activity.user}</span>
                      <span className="text-xs text-gray-400 mx-2">•</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 ml-3" />
              التنبيهات والإشعارات
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertBgColor(alert.type)}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 ml-3">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : alert.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.priority === 'high' ? 'عالي' : alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemMetrics;
