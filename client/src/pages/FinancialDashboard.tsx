import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Users,
  CreditCard,
  Building,
  Calculator,
  Receipt,
  UserCheck,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';

const FinancialDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'دليل الحسابات',
      description: 'دليل الحسابات والأرصدة',
      icon: Calculator,
      color: 'blue' as const,
      href: '/financial/chart-of-accounts'
    },
    {
      title: 'قيود اليومية',
      description: 'إنشاء وإدارة القيود المحاسبية',
      icon: FileText,
      color: 'green' as const,
      href: '/financial/journal'
    },
    {
      title: 'كشف الحساب',
      description: 'عرض حركة الحساب خلال فترة محددة',
      icon: FileText,
      color: 'orange' as const,
      href: '/financial/account-statement'
    },
    {
      title: 'الأصول الثابتة',
      description: 'إدارة الأصول والاستهلاك',
      icon: Building,
      color: 'green' as const,
      href: '/financial/fixed-assets'
    },
    {
      title: 'القيد الافتتاحي',
      description: 'إدارة الأرصدة الافتتاحية',
      icon: BarChart3,
      color: 'purple' as const,
      href: '/financial/opening-balance'
    },
    {
      title: 'مراقبة الحسابات',
      description: 'مراقبة الحسابات الرئيسية',
      icon: UserCheck,
      color: 'red' as const,
      href: '/financial/account-monitoring'
    },
    {
      title: 'تقارير الفواتير',
      description: 'تقارير الفواتير المسددة وغير المسددة',
      icon: Receipt,
      color: 'indigo' as const,
      href: '/financial/invoice-reports'
    },
    {
      title: 'التقارير الفورية',
      description: 'تقارير فورية عن المقبوضات والمدفوعات والمبيعات',
      icon: BarChart3,
      color: 'teal' as const,
      href: '/financial/instant-reports'
    },
    {
      title: 'العملاء',
      description: 'إدارة بيانات العملاء والأرصدة',
      icon: Users,
      color: 'indigo' as const,
      href: '/financial/customers'
    },
    {
      title: 'كشف حساب الموظفين',
      description: 'عرض بيانات الموظفين ورواتبهم وسلفهم وعهودهم',
      icon: UserCheck,
      color: 'red' as const,
      href: '/financial/employee-accounts'
    },
    {
      title: 'التقارير المالية',
      description: 'الميزانية وقائمة الدخل والتقارير',
      icon: BarChart3,
      color: 'blue' as const,
      href: '/financial/reports'
    }
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="card-gradient border-r-4 border-golden-500 p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-golden-500 to-golden-600 rounded-xl flex items-center justify-center shadow-lg golden-glow ml-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">النظام المالي</h1>
              <p className="text-gray-600 text-lg">إدارة شاملة للعمليات المالية والمحاسبية</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">آخر تحديث</p>
            <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('ar-EG')}</p>
            <div className="mt-2 inline-flex items-center bg-success-100 text-success-800 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-success-400 rounded-full ml-2 animate-pulse"></div>
              <span className="text-sm font-medium">متصل</span>
            </div>
          </div>
        </div>
      </div>

{/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const colorClasses = {
              blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
              green: { bg: 'bg-success-100', icon: 'text-success-600' },
              purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
              indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
              yellow: { bg: 'bg-warning-100', icon: 'text-warning-600' },
              red: { bg: 'bg-danger-100', icon: 'text-danger-600' },
              orange: { bg: 'bg-orange-100', icon: 'text-orange-600' },
              teal: { bg: 'bg-teal-100', icon: 'text-teal-600' }
            };
            
            const colors = colorClasses[action.color] || colorClasses.blue;
            
            return (
              <div
                key={index}
                onClick={() => navigate(action.href)}
                className="card-hover cursor-pointer group transition-professional border-r-4 border-golden-500 hover:border-golden-600"
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${colors.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className={`h-6 w-6 ${colors.icon}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-golden-700 transition-colors">{action.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-golden-600 transition-colors duration-300 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">النشاط الأخير</h2>
          <button className="btn btn-outline text-sm">
            عرض الكل
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-success-50 border border-success-200 rounded-lg transition-professional hover:bg-success-100">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">تم إنشاء فاتورة جديدة</p>
                    <p className="text-sm text-gray-600">فاتورة رقم INV-2024-001</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">$2,500</p>
                  <p className="text-xs text-gray-500">منذ ساعة</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg transition-professional hover:bg-blue-100">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">تم استلام دفعة</p>
                    <p className="text-sm text-gray-600">من العميل أحمد محمد</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">$1,200</p>
                  <p className="text-xs text-gray-500">منذ ساعتين</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-warning-50 border border-warning-200 rounded-lg transition-professional hover:bg-warning-100">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">قيد محاسبي جديد</p>
                    <p className="text-sm text-gray-600">قيد مصروفات إدارية</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">$850</p>
                  <p className="text-xs text-gray-500">منذ 3 ساعات</p>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;