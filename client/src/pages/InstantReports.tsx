import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Receipt,
  Calendar,
  Filter,
  Download,
  Printer,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { financialAPI } from '../services/api';

interface ReportData {
  totalAmount: number;
  count: number;
  trend: number;
  period: string;
  details?: any[];
}

interface InstantReports {
  receipts: ReportData;
  payments: ReportData;
  revenue: ReportData;
  receivables: ReportData;
  payables: ReportData;
  cashFlow: ReportData;
}

const InstantReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<InstantReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState<any[]>([]);

  useEffect(() => {
    loadInstantReports();
  }, [selectedPeriod]);

    const loadInstantReports = async () => {
    setLoading(true);
    try {
      const data = await financialAPI.getInstantReports({ period: selectedPeriod });
      setReports(data);
         } catch (error) {
       console.error('Error loading instant reports:', error);
     } finally {
       setLoading(false);
     }
   };

  const handleReportClick = (reportType: string) => {
    setSelectedReport(reportType);
    if (reports) {
      setReportDetails(reports[reportType as keyof InstantReports]?.details || []);
    }
  };

  const handlePrint = (reportType: string) => {
    // Implement print functionality
    console.log('Printing report:', reportType);
  };

  const handleExport = (reportType: string) => {
    // Implement export functionality
    console.log('Exporting report:', reportType);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'quarter': return 'هذا الربع';
      case 'year': return 'هذا العام';
      default: return 'اليوم';
    }
  };

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'receipts': return DollarSign;
      case 'payments': return CreditCard;
      case 'revenue': return TrendingUp;
      case 'receivables': return Users;
      case 'payables': return Receipt;
      case 'cashFlow': return Activity;
      default: return BarChart3;
    }
  };

  const getReportColor = (reportType: string) => {
    switch (reportType) {
      case 'receipts': return 'green';
      case 'payments': return 'red';
      case 'revenue': return 'blue';
      case 'receivables': return 'orange';
      case 'payables': return 'purple';
      case 'cashFlow': return 'indigo';
      default: return 'gray';
    }
  };

  const reportConfigs = [
    {
      key: 'receipts',
      title: 'المقبوضات',
      description: 'إجمالي المقبوضات والمدفوعات المستلمة',
      icon: DollarSign,
      color: 'green'
    },
    {
      key: 'payments',
      title: 'المدفوعات',
      description: 'إجمالي المدفوعات والمصروفات',
      icon: CreditCard,
      color: 'red'
    },
    {
      key: 'revenue',
      title: 'الإيرادات',
      description: 'إجمالي الإيرادات والمقبوضات',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      key: 'receivables',
      title: 'المدينون',
      description: 'الأرصدة المدينة والمستحقات',
      icon: Users,
      color: 'orange'
    },
    {
      key: 'payables',
      title: 'الدائنون',
      description: 'الأرصدة الدائنة والمطلوبات',
      icon: Receipt,
      color: 'purple'
    },
    {
      key: 'cashFlow',
      title: 'التدفق النقدي',
      description: 'صافي التدفق النقدي',
      icon: Activity,
      color: 'indigo'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-golden-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="card-gradient border-r-4 border-golden-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline btn-sm ml-4"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">التقارير والاستفسارات الفورية</h1>
              <p className="text-gray-600">تقارير فورية عن المقبوضات والمدفوعات والتدفق النقدي والمديونية</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="text-right">
              <p className="text-sm text-gray-500">آخر تحديث</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date().toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">الفترة الزمنية</h2>
          <Filter className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'today', label: 'اليوم' },
            { value: 'week', label: 'هذا الأسبوع' },
            { value: 'month', label: 'هذا الشهر' },
            { value: 'quarter', label: 'هذا الربع' },
            { value: 'year', label: 'هذا العام' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-golden-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportConfigs.map((config) => {
          const reportData = reports?.[config.key as keyof InstantReports];
          const IconComponent = config.icon;
          
          return (
            <div
              key={config.key}
              onClick={() => handleReportClick(config.key)}
              className="card cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-golden-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${config.color}-100`}>
                  <IconComponent className={`h-6 w-6 text-${config.color}-600`} />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(config.key);
                    }}
                    className="btn btn-outline btn-xs"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrint(config.key);
                    }}
                    className="btn btn-outline btn-xs"
                  >
                    <Printer className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{config.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{config.description}</p>
              
              {reportData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المبلغ الإجمالي</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(reportData.totalAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">عدد العمليات</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reportData.count}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المعدل</span>
                    <div className="flex items-center">
                      {reportData.trend > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        reportData.trend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(reportData.trend)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Report Details Modal */}
      {selectedReport && reportDetails.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                تفاصيل {reportConfigs.find(c => c.key === selectedReport)?.title}
              </h2>
              <p className="text-sm text-gray-600">
                الفترة: {getPeriodLabel(selectedPeriod)}
              </p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="btn btn-outline btn-sm"
            >
              إغلاق
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right font-medium text-gray-700">التفاصيل</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">المبلغ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {reportDetails.map((detail, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {detail.customer || detail.supplier || detail.product || detail.type}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(detail.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(detail.date || detail.dueDate).toLocaleDateString('ar-LY')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {detail.method || detail.category || detail.daysOverdue ? 
                        (detail.daysOverdue > 0 ? `متأخر ${detail.daysOverdue} يوم` : 'في الموعد') : 
                        'مكتمل'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-600">صافي التدفق النقدي</div>
              <div className="text-lg font-bold text-green-900">
                {reports?.cashFlow ? formatCurrency(reports.cashFlow.totalAmount) : '0 LYD'}
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600">إجمالي الإيرادات</div>
              <div className="text-lg font-bold text-blue-900">
                {reports?.revenue ? formatCurrency(reports.revenue.totalAmount) : '0 LYD'}
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-600">المستحقات</div>
              <div className="text-lg font-bold text-orange-900">
                {reports?.receivables ? formatCurrency(reports.receivables.totalAmount) : '0 LYD'}
              </div>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-600">المطلوبات</div>
              <div className="text-lg font-bold text-purple-900">
                {reports?.payables ? formatCurrency(reports.payables.totalAmount) : '0 LYD'}
              </div>
            </div>
            <Receipt className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstantReports;
