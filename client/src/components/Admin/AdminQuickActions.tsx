import React from 'react';
import { 
  Users, 
  Shield, 
  DollarSign, 
  ShoppingCart, 
  Settings, 
  FileText, 
  BarChart3, 
  Plus,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
  disabled?: boolean;
}

interface AdminQuickActionsProps {
  onNavigateToUsers?: () => void;
  onNavigateToRoles?: () => void;
  onNavigateToFinancial?: () => void;
  onNavigateToSales?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToReports?: () => void;
  onRefreshData?: () => void;
  onExportData?: () => void;
  onCreateUser?: () => void;
  onCreateRole?: () => void;
}

const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  onNavigateToUsers,
  onNavigateToRoles,
  onNavigateToFinancial,
  onNavigateToSales,
  onNavigateToSettings,
  onNavigateToReports,
  onRefreshData,
  onExportData,
  onCreateUser,
  onCreateRole
}) => {
  const quickActions: QuickAction[] = [
    {
      id: 'create-user',
      title: 'إضافة مستخدم',
      description: 'إنشاء حساب مستخدم جديد',
      icon: Plus,
      color: 'blue',
      action: onCreateUser || (() => {}),
      disabled: !onCreateUser
    },
    {
      id: 'create-role',
      title: 'إضافة دور',
      description: 'إنشاء دور جديد بصلاحيات مخصصة',
      icon: Shield,
      color: 'purple',
      action: onCreateRole || (() => {}),
      disabled: !onCreateRole
    },
    {
      id: 'view-users',
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة جميع المستخدمين',
      icon: Users,
      color: 'green',
      action: onNavigateToUsers || (() => {}),
      disabled: !onNavigateToUsers
    },
    {
      id: 'view-roles',
      title: 'إدارة الأدوار',
      description: 'عرض وإدارة أدوار النظام',
      icon: Shield,
      color: 'indigo',
      action: onNavigateToRoles || (() => {}),
      disabled: !onNavigateToRoles
    },
    {
      id: 'financial-dashboard',
      title: 'النظام المالي',
      description: 'الوصول إلى لوحة التحكم المالية',
      icon: DollarSign,
      color: 'emerald',
      action: onNavigateToFinancial || (() => {}),
      disabled: !onNavigateToFinancial
    },
    {
      id: 'sales-dashboard',
      title: 'نظام المبيعات',
      description: 'الوصول إلى لوحة تحكم المبيعات',
      icon: ShoppingCart,
      color: 'orange',
      action: onNavigateToSales || (() => {}),
      disabled: !onNavigateToSales
    },
    {
      id: 'system-settings',
      title: 'إعدادات النظام',
      description: 'تكوين إعدادات النظام العامة',
      icon: Settings,
      color: 'gray',
      action: onNavigateToSettings || (() => {}),
      disabled: !onNavigateToSettings
    },
    {
      id: 'reports',
      title: 'التقارير',
      description: 'عرض التقارير والإحصائيات',
      icon: BarChart3,
      color: 'pink',
      action: onNavigateToReports || (() => {}),
      disabled: !onNavigateToReports
    },
    {
      id: 'refresh-data',
      title: 'تحديث البيانات',
      description: 'إعادة تحميل جميع البيانات',
      icon: RefreshCw,
      color: 'cyan',
      action: onRefreshData || (() => {}),
      disabled: !onRefreshData
    },
    {
      id: 'export-data',
      title: 'تصدير البيانات',
      description: 'تصدير بيانات النظام',
      icon: Download,
      color: 'teal',
      action: onExportData || (() => {}),
      disabled: !onExportData
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700',
      emerald: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700',
      orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700',
      gray: 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700',
      pink: 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700',
      cyan: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700',
      teal: 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600',
      pink: 'text-pink-600',
      cyan: 'text-cyan-600',
      teal: 'text-teal-600'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="h-6 w-6 text-gray-600 ml-3" />
          الإجراءات السريعة
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                disabled={action.disabled}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-right
                  ${action.disabled 
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                    : `${getColorClasses(action.color)} hover:shadow-md transform hover:-translate-y-0.5 cursor-pointer`
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <IconComponent 
                    className={`h-6 w-6 ${action.disabled ? 'text-gray-400' : getIconColorClasses(action.color)}`} 
                  />
                </div>
                <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                <p className="text-xs opacity-75 leading-relaxed">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminQuickActions;
