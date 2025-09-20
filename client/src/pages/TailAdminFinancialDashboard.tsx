import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  Calculator,
  Plus,
  FileText,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { financialAPI } from '../services/api';
import TailAdminDashboardCard from '../components/TailAdmin/Cards/TailAdminDashboardCard';
import TailAdminDataTable, { TableColumn, TableAction } from '../components/TailAdmin/Tables/TailAdminDataTable';
import TailAdminChart from '../components/TailAdmin/Charts/TailAdminChart';
import { FinancialSummary } from '../types/financial';

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  status: 'pending' | 'completed' | 'cancelled';
}

const TailAdminFinancialDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Load financial summary
      const summaryData = await financialAPI.getFinancialSummary();
      setSummary(summaryData);
      
      // Mock recent transactions data
      const mockTransactions: RecentTransaction[] = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'مقبوضات من عميل - شركة التجارة الدولية',
          amount: 15000,
          type: 'income',
          category: 'مبيعات',
          status: 'completed'
        },
        {
          id: '2',
          date: '2024-01-14',
          description: 'دفع فاتورة كهرباء',
          amount: 850,
          type: 'expense',
          category: 'مصاريف تشغيلية',
          status: 'completed'
        },
        {
          id: '3',
          date: '2024-01-14',
          description: 'راتب موظف - أحمد محمد',
          amount: 2500,
          type: 'expense',
          category: 'رواتب',
          status: 'pending'
        },
        {
          id: '4',
          date: '2024-01-13',
          description: 'مقبوضات نقدية',
          amount: 8500,
          type: 'income',
          category: 'مبيعات',
          status: 'completed'
        },
        {
          id: '5',
          date: '2024-01-12',
          description: 'شراء مستلزمات مكتبية',
          amount: 320,
          type: 'expense',
          category: 'مصاريف عامة',
          status: 'completed'
        }
      ];
      
      setTransactions(mockTransactions);
      setPagination(prev => ({ ...prev, total: mockTransactions.length }));
      
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const monthlyRevenueData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [{
      label: 'الإيرادات الشهرية',
      data: [45000, 52000, 48000, 61000, 55000, 67000],
      backgroundColor: '#FFD700',
      borderColor: '#B8860B'
    }]
  };

  const expenseDistributionData = {
    labels: ['رواتب', 'مصاريف تشغيلية', 'مصاريف عامة', 'مواد خام', 'أخرى'],
    datasets: [{
      label: 'توزيع المصاريف',
      data: [35, 25, 15, 15, 10],
      backgroundColor: ['#FFD700', '#B8860B', '#FFECB3', '#F4C430', '#DAA520']
    }]
  };

  // Table columns
  const transactionColumns: TableColumn<RecentTransaction>[] = [
    {
      key: 'date',
      title: 'التاريخ',
      dataIndex: 'date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('ar-LY')
    },
    {
      key: 'description',
      title: 'الوصف',
      dataIndex: 'description',
      searchable: true
    },
    {
      key: 'category',
      title: 'الفئة',
      dataIndex: 'category',
      filterable: true
    },
    {
      key: 'amount',
      title: 'المبلغ',
      dataIndex: 'amount',
      sortable: true,
      align: 'center',
      render: (value, record) => (
        <span className={`font-semibold ${
          record.type === 'income' ? 'text-success-600' : 'text-danger-600'
        }`}>
          {record.type === 'income' ? '+' : '-'}
          {value.toLocaleString('ar-LY')} د.ل
        </span>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      dataIndex: 'status',
      align: 'center',
      render: (value) => {
        const statusConfig = {
          completed: { label: 'مكتمل', color: 'bg-success-100 text-success-800' },
          pending: { label: 'معلق', color: 'bg-warning-100 text-warning-800' },
          cancelled: { label: 'ملغي', color: 'bg-danger-100 text-danger-800' }
        };
        const config = statusConfig[value as keyof typeof statusConfig];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
        );
      }
    }
  ];

  // Table actions
  const transactionActions: TableAction<RecentTransaction>[] = [
    {
      key: 'view',
      label: 'عرض',
      icon: <Eye className="h-4 w-4" />,
      onClick: (record) => console.log('View:', record),
      color: 'primary'
    },
    {
      key: 'edit',
      label: 'تعديل',
      icon: <Edit className="h-4 w-4" />,
      onClick: (record) => console.log('Edit:', record),
      color: 'warning',
      visible: (record) => record.status === 'pending'
    },
    {
      key: 'delete',
      label: 'حذف',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (record) => console.log('Delete:', record),
      color: 'danger',
      visible: (record) => record.status === 'pending'
    }
  ];

  const quickActions = [
    {
      title: 'دليل الحسابات',
      description: 'دليل الحسابات والأرصدة',
      icon: Calculator,
      color: 'primary' as const,
      href: '/financial/accounts'
    },
    {
      title: 'قيود اليومية',
      description: 'إنشاء وإدارة القيود المحاسبية',
      icon: FileText,
      color: 'success' as const,
      href: '/financial/journal'
    },
    {
      title: 'العملاء',
      description: 'إدارة بيانات العملاء والأرصدة',
      icon: Users,
      color: 'info' as const,
      href: '/financial/customers'
    },
    {
      title: 'إدارة الفواتير المحسن',
      description: 'نظام إدارة الفواتير الموحد والمتطور',
      icon: FileText,
      color: 'warning' as const,
      href: '/sales/invoice-management'
    },
    {
      title: 'إنشاء حسابات الفواتير تلقائياً',
      description: 'إنشاء الحسابات المطلوبة للفواتير في دليل الحسابات',
      icon: Settings,
      color: 'indigo' as const,
      href: '/financial/auto-account-creator'
    },
    {
      title: 'إدارة الموظفين والرواتب',
      description: 'إدارة الموظفين والرواتب والسلف والمستحقات',
      icon: UserCheck,
      color: 'danger' as const,
      href: '/financial/employee-payroll'
    },
    {
      title: 'الأصول الثابتة',
      description: 'إدارة الأصول والاستهلاك',
      icon: Building2,
      color: 'success' as const,
      href: '/financial/fixed-assets'
    },
    {
      title: 'التقارير المالية',
      description: 'الميزانية وقائمة الدخل والتقارير',
      icon: BarChart3,
      color: 'purple' as const,
      href: '/financial/reports'
    }
  ];

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-golden-500 to-golden-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-xl ml-4">
              <DollarSign className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">القسم المالي</h1>
              <p className="text-white/90 text-lg">نظام إدارة الشؤون المالية والمحاسبية المحدث</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-white/80 text-sm">تاريخ اليوم</p>
            <p className="text-white font-semibold text-lg">
              {new Date().toLocaleDateString('ar-LY')}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TailAdminDashboardCard
              key={i}
              title="جاري التحميل..."
              value="--"
              icon={TrendingUp}
              loading={true}
            />
          ))
        ) : summary ? (
          <>
            <TailAdminDashboardCard
              title="إجمالي الأصول"
              value={summary.totalAssets}
              icon={TrendingUp}
              color="primary"
              currency={summary.currency}
              trend={{
                direction: 'up',
                percentage: 12.5,
                period: 'من الشهر الماضي'
              }}
              interactive
              onClick={() => navigate('/financial/reports')}
            />
            <TailAdminDashboardCard
              title="صافي الدخل"
              value={summary.netIncome}
              icon={summary.netIncome >= 0 ? ArrowUpRight : ArrowDownRight}
              color={summary.netIncome >= 0 ? "success" : "danger"}
              currency={summary.currency}
              trend={{
                direction: summary.netIncome >= 0 ? 'up' : 'down',
                percentage: 8.3,
                period: 'من الشهر الماضي'
              }}
              interactive
              onClick={() => navigate('/financial/reports')}
            />
            <TailAdminDashboardCard
              title="رصيد النقدية"
              value={summary.cashBalance}
              icon={DollarSign}
              color="success"
              currency={summary.currency}
              trend={{
                direction: 'up',
                percentage: 5.7,
                period: 'من الأسبوع الماضي'
              }}
              interactive
              onClick={() => navigate('/financial/reports')}
            />
            <TailAdminDashboardCard
              title="ذمم العملاء"
              value={summary.accountsReceivable}
              icon={Users}
              color="warning"
              currency={summary.currency}
              trend={{
                direction: 'down',
                percentage: 3.2,
                period: 'من الشهر الماضي'
              }}
              interactive
              onClick={() => navigate('/financial/customers')}
            />
          </>
        ) : null}
      </div>

      {/* Invoice Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <TailAdminDashboardCard
          title="إجمالي الفواتير"
          value={156}
          icon={FileText}
          color="primary"
          trend={{
            direction: 'up',
            percentage: 15.2,
            period: 'من الشهر الماضي'
          }}
          interactive
          onClick={() => navigate('/sales/invoice-management')}
        />
        <TailAdminDashboardCard
          title="الفواتير المدفوعة"
          value={98}
          icon={CheckCircle}
          color="success"
          trend={{
            direction: 'up',
            percentage: 8.7,
            period: 'من الشهر الماضي'
          }}
          interactive
          onClick={() => navigate('/sales/invoice-management')}
        />
        <TailAdminDashboardCard
          title="الفواتير المعلقة"
          value={42}
          icon={Clock}
          color="warning"
          trend={{
            direction: 'down',
            percentage: 5.3,
            period: 'من الشهر الماضي'
          }}
          interactive
          onClick={() => navigate('/sales/invoice-management')}
        />
        <TailAdminDashboardCard
          title="الفواتير المتأخرة"
          value={16}
          icon={AlertTriangle}
          color="danger"
          trend={{
            direction: 'up',
            percentage: 12.1,
            period: 'من الشهر الماضي'
          }}
          interactive
          onClick={() => navigate('/sales/invoice-management')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TailAdminChart
          type="bar"
          data={monthlyRevenueData}
          title="الإيرادات الشهرية"
          description="إجمالي الإيرادات خلال الأشهر الستة الأخيرة"
          height={300}
          rtl={true}
          theme="golden"
        />
        
        <TailAdminChart
          type="doughnut"
          data={expenseDistributionData}
          title="توزيع المصاريف"
          description="تصنيف المصاريف حسب النوع للشهر الحالي"
          height={300}
          rtl={true}
          theme="golden"
        />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark-800">الوحدات المالية</h2>
          <button className="bg-golden-500 hover:bg-golden-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center">
            <Plus className="h-4 w-4 ml-2" />
            إضافة جديد
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <TailAdminDashboardCard
              key={index}
              title={action.title}
              value=""
              subtitle={action.description}
              icon={action.icon}
              color={action.color}
              size="md"
              interactive
              onClick={() => {
                if (action.href.includes('/accounts') || action.href.includes('/journal') || 
                    action.href.includes('/customers') || 
                    action.href.includes('/employee-payroll') || action.href.includes('/fixed-assets') || 
                    action.href.includes('/reports')) {
                  navigate(action.href);
                } else {
                  alert(`سيتم تطوير وحدة ${action.title} قريباً`);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <TailAdminDataTable
        data={transactions}
        columns={transactionColumns}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={transactionActions}
        title="المعاملات الأخيرة"
        exportable
        onExport={() => console.log('Export transactions')}
        searchable
        filterable
        selection={{
          enabled: true,
          onSelectionChange: (keys: any, rows: any) => console.log('Selected:', keys, rows)
        }}
        striped
        bordered
      />
    </div>
  );
};

export default TailAdminFinancialDashboard;