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
  Activity,
  Eye,
  FileText
} from 'lucide-react';
import { financialAPI } from '../services/api';
import { Modal } from '../components/UI/Modal';

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
  expenses: ReportData;
  revenue: ReportData;
  receivables: ReportData;
  payables: ReportData;
  cashFlow: ReportData;
}

const InstantReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<InstantReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reportDetails, setReportDetails] = useState<any[]>([]);

  useEffect(() => {
    loadInstantReports();
  }, [selectedPeriod]);

    const loadInstantReports = async () => {
    setLoading(true);
    try {
      console.log('Loading instant reports for period:', selectedPeriod);
      const data = await financialAPI.getInstantReports({ period: selectedPeriod });
      console.log('Instant reports data received:', data);
      setReports(data);
         } catch (error) {
       console.error('Error loading instant reports:', error);
       // Set empty data structure to prevent blank cards
       setReports({
         receipts: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] },
         payments: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] },
         expenses: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] },
         revenue: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] },
         receivables: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] },
         payables: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] },
         cashFlow: { totalAmount: 0, count: 0, trend: 0, period: selectedPeriod, details: [] }
       });
     } finally {
       setLoading(false);
     }
   };

  const handleReportClick = (reportType: string) => {
    setSelectedReport(reportType);
    setSelectedCategory(reportType);
    setIsModalOpen(true);
    loadCategoryDetails(reportType);
  };

  const loadCategoryDetails = async (category: string) => {
    try {
      setDetailsLoading(true);
      console.log(`🔄 Loading details for category: ${category}`);

      let response;
      switch (category) {
        case 'revenue':
          response = await financialAPI.getGLEntries({
            limit: 100
          });
          break;
        case 'receipts':
          response = await financialAPI.getGLEntries({
            limit: 100
          });
          break;
        case 'payments':
          response = await financialAPI.getGLEntries({
            limit: 100
          });
          break;
        case 'expenses':
          // Try to get GL entries first
          try {
            response = await financialAPI.getGLEntries({
              limit: 100
            });
          } catch (error) {
            console.warn('Could not fetch GL entries for expenses, using instant reports data');
            // Fallback to using the details from instant reports
            response = {
              data: reports?.expenses?.details?.map(detail => ({
                id: `expense-${detail.account}`,
                account: {
                  code: detail.account,
                  name: detail.type,
                  type: 'expense'
                },
                debit: detail.amount,
                credit: 0,
                postingDate: detail.date,
                description: `مصروف - ${detail.type}`,
                voucherType: 'Expense'
              })) || []
            };
          }
          break;
        case 'receivables':
          response = await financialAPI.getReceivablesDetails({
            period: selectedPeriod,
            limit: 100
          });
          break;
        case 'payables':
          response = await financialAPI.getGLEntries({
            limit: 100
          });
          break;
        case 'cashFlow':
          response = await financialAPI.getGLEntries({
            limit: 100
          });
          break;
        default:
          response = { data: [] };
      }

      // Handle different response formats
      const detailsData = response.data?.data || response.data || [];
      setCategoryDetails(detailsData);
      console.log(`✅ Loaded ${detailsData.length || 0} detail records for ${category}`);
    } catch (error) {
      console.error(`❌ Error loading category details for ${category}:`, error);
      setCategoryDetails([]);
    } finally {
      setDetailsLoading(false);
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
      description: 'إجمالي المدفوعات النقدية',
      icon: CreditCard,
      color: 'red'
    },
    {
      key: 'expenses',
      title: 'المصروفات',
      description: 'إجمالي المصروفات والتكاليف',
      icon: TrendingDown,
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
            <div className="text-right min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">آخر تحديث</p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              
              {reportData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المبلغ الإجمالي</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(reportData.totalAmount || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">عدد العمليات</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reportData.count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">المعدل</span>
                    <div className="flex items-center">
                      {(reportData.trend || 0) > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        (reportData.trend || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(reportData.trend || 0)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportClick(config.key);
                      }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-golden-300 rounded-md shadow-sm text-sm font-medium text-golden-700 bg-golden-50 hover:bg-golden-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-golden-500"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      عرض التفاصيل الكاملة
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">جاري تحميل البيانات...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`تفاصيل ${reportConfigs.find(c => c.key === selectedCategory)?.title || selectedCategory}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              الفترة: {getPeriodLabel(selectedPeriod)}
            </p>
            <p className="text-sm text-gray-600">
              إجمالي السجلات: {categoryDetails.length}
            </p>
          </div>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">جاري تحميل التفاصيل...</p>
              </div>
            </div>
          ) : categoryDetails.length > 0 ? (
            <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      التاريخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      الحساب
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      الوصف
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      نوع السند
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      مدين
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      دائن
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryDetails.map((detail, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-100">
                        {new Date(detail.date || detail.postingDate).toLocaleDateString('ar-LY')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                        <div>
                          <div className="font-medium">{detail.account?.name || 'غير محدد'}</div>
                          <div className="text-xs text-gray-500">{detail.account?.code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                        {detail.description || detail.remarks || 'بدون وصف'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                        {detail.voucherType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium border-r border-gray-100">
                        {detail.debit > 0 ? formatCurrency(detail.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {detail.credit > 0 ? formatCurrency(detail.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد بيانات متاحة لهذه الفئة</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
