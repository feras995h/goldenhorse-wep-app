import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Calendar, Filter, TrendingUp, DollarSign, PieChart, BookOpen } from 'lucide-react';
import { financialAPI } from '../services/api';
import FormField from '../components/Financial/FormField';
import { TrialBalanceEntry, IncomeStatementEntry, BalanceSheetEntry } from '../types/financial';
import OpeningTrialBalanceReport from '../components/Financial/OpeningTrialBalanceReport';

const FinancialReports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'opening-trial-balance' | 'trial-balance' | 'income-statement' | 'balance-sheet' | 'cash-flow'>('opening-trial-balance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('LYD');
  const [branch, setBranch] = useState('');

  const reportTypes = [
    {
      id: 'opening-trial-balance',
      title: 'ميزان المراجعة الافتتاحي',
      description: 'الأرصدة الافتتاحية للحسابات',
      icon: BookOpen,
      color: 'indigo'
    },
    {
      id: 'trial-balance',
      title: 'ميزان المراجعة',
      description: 'عرض أرصدة جميع الحسابات',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'income-statement',
      title: 'قائمة الدخل',
      description: 'الإيرادات والمصروفات وصافي الدخل',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'balance-sheet',
      title: 'الميزانية العمومية',
      description: 'الأصول والخصوم وحقوق الملكية',
      icon: DollarSign,
      color: 'purple'
    },
    {
      id: 'cash-flow',
      title: 'قائمة التدفقات النقدية',
      description: 'التدفقات النقدية الداخلة والخارجة',
      icon: PieChart,
      color: 'orange'
    }
  ];

  useEffect(() => {
    if (activeReport) {
      generateReport();
    }
  }, [activeReport, dateFrom, dateTo, currency, branch]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = {
        dateFrom,
        dateTo,
        currency,
        branch: branch || undefined
      };

      let response;
      switch (activeReport) {
        case 'trial-balance':
          response = await financialAPI.getTrialBalance(params);
          break;
        case 'income-statement':
          response = await financialAPI.getIncomeStatement(params);
          break;
        case 'balance-sheet':
          response = await financialAPI.getBalanceSheet(params);
          break;
        case 'cash-flow':
          response = await financialAPI.getCashFlowStatement(params);
          break;
        default:
          return;
      }
      
      setReportData(response);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = {
        type: activeReport,
        format,
        dateFrom,
        dateTo,
        currency,
        branch: branch || undefined
      };
      
      const response = await financialAPI.exportReport(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}-${dateFrom}-${dateTo}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    }
  };

  const renderTrialBalance = () => {
    if (!reportData?.entries) return null;

    const totalDebit = reportData.entries.reduce((sum: number, entry: TrialBalanceEntry) => sum + entry.debit, 0);
    const totalCredit = reportData.entries.reduce((sum: number, entry: TrialBalanceEntry) => sum + entry.credit, 0);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                رمز الحساب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم الحساب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                مدين
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                دائن
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الرصيد
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.entries.map((entry: TrialBalanceEntry, index: number) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.accountCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.accountName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                  {entry.debit > 0 ? new Intl.NumberFormat('ar-LY').format(entry.debit) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                  {entry.credit > 0 ? new Intl.NumberFormat('ar-LY').format(entry.credit) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                  <span className={entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {new Intl.NumberFormat('ar-LY').format(Math.abs(entry.balance))}
                    {entry.balance < 0 ? ' (دائن)' : ' (مدين)'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">
                الإجمالي
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 text-left">
                {new Intl.NumberFormat('ar-LY').format(isNaN(totalDebit) || !isFinite(totalDebit) ? 0 : totalDebit)}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 text-left">
                {new Intl.NumberFormat('ar-LY').format(isNaN(totalCredit) || !isFinite(totalCredit) ? 0 : totalCredit)}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900 text-left">
                <span className={Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(totalDebit - totalCredit) < 0.01 ? 'متوازن' : 'غير متوازن'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!reportData) return null;

    const { revenues, expenses, netIncome } = reportData;

    return (
      <div className="space-y-6">
        {/* Revenues */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الإيرادات</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحساب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenues?.map((entry: IncomeStatementEntry, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-left">
                      {new Intl.NumberFormat('ar-LY').format(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-green-100">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    إجمالي الإيرادات
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600 text-left">
                    {new Intl.NumberFormat('ar-LY').format(
                      revenues?.reduce((sum: number, entry: IncomeStatementEntry) => sum + entry.amount, 0) || 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">المصروفات</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحساب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses?.map((entry: IncomeStatementEntry, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-left">
                      {new Intl.NumberFormat('ar-LY').format(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-red-100">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    إجمالي المصروفات
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-600 text-left">
                    {new Intl.NumberFormat('ar-LY').format(
                      expenses?.reduce((sum: number, entry: IncomeStatementEntry) => sum + entry.amount, 0) || 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">صافي الدخل</h3>
            <span className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('ar-LY').format(Math.abs(netIncome))} {currency}
              {netIncome < 0 && ' (خسارة)'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;

    const { assets, liabilities, equity, totalAssets, totalLiabilitiesAndEquity } = reportData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Assets */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الأصول</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحساب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets?.map((entry: BalanceSheetEntry, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-left">
                      {new Intl.NumberFormat('ar-LY').format(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-100">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    إجمالي الأصول
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600 text-left">
                    {new Intl.NumberFormat('ar-LY').format(isNaN(totalAssets) || !isFinite(totalAssets) ? 0 : totalAssets)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Liabilities and Equity */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الخصوم وحقوق الملكية</h3>
          <div className="space-y-4">
            {/* Liabilities */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">الخصوم</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liabilities?.map((entry: BalanceSheetEntry, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-left">
                          {new Intl.NumberFormat('ar-LY').format(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">حقوق الملكية</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equity?.map((entry: BalanceSheetEntry, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.accountName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-left">
                          {new Intl.NumberFormat('ar-LY').format(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-100 p-4 rounded">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">إجمالي الخصوم وحقوق الملكية</span>
                <span className="text-sm font-bold text-gray-900">
                  {new Intl.NumberFormat('ar-LY').format(isNaN(totalLiabilitiesAndEquity) || !isFinite(totalLiabilitiesAndEquity) ? 0 : totalLiabilitiesAndEquity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!reportData) return null;

    return (
      <div className="text-center py-8">
        <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">قائمة التدفقات النقدية</h3>
        <p className="text-gray-600">سيتم تطوير هذا التقرير قريباً</p>
      </div>
    );
  };

  const currencyOptions = [
    { value: 'LYD', label: 'دينار ليبي' },
    { value: 'USD', label: 'دولار أمريكي' },
    { value: 'EUR', label: 'يورو' }
  ];

  const branchOptions = [
    { value: '', label: 'جميع الفروع' },
    { value: 'main', label: 'الفرع الرئيسي' },
    { value: 'tripoli', label: 'طرابلس' },
    { value: 'benghazi', label: 'بنغازي' },
    { value: 'misrata', label: 'مصراتة' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">التقارير المالية</h1>
            <p className="text-sm sm:text-base text-gray-600">الميزانية وقائمة الدخل والتقارير المالية</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse w-full sm:w-auto">
          <button
            onClick={() => exportReport('pdf')}
            className="btn-secondary flex items-center justify-center w-full sm:w-auto"
            disabled={loading || !reportData}
          >
            <FileText className="h-4 w-4 ml-2" />
            تصدير PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="btn-secondary flex items-center justify-center w-full sm:w-auto"
            disabled={loading || !reportData}
          >
            <FileText className="h-4 w-4 ml-2" />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className={`card p-4 cursor-pointer transition-all duration-200 ${
              activeReport === report.id
                ? `border-${report.color}-500 bg-${report.color}-50`
                : 'hover:shadow-md'
            }`}
            onClick={() => setActiveReport(report.id as any)}
          >
            <div className="flex items-center mb-3">
              <div className={`p-2 rounded-lg bg-${report.color}-100 ml-3`}>
                <report.icon className={`h-5 w-5 text-${report.color}-600`} />
              </div>
              <h3 className={`font-semibold ${
                activeReport === report.id ? `text-${report.color}-900` : 'text-gray-900'
              }`}>
                {report.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600">{report.description}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-600 ml-2" />
          <h3 className="text-lg font-semibold text-gray-900">فلاتر التقرير</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            label="من تاريخ"
            name="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(value) => setDateFrom(value as string)}
          />

          <FormField
            label="إلى تاريخ"
            name="dateTo"
            type="date"
            value={dateTo}
            onChange={(value) => setDateTo(value as string)}
          />

          <FormField
            label="العملة"
            name="currency"
            type="select"
            value={currency}
            onChange={(value) => setCurrency(value as string)}
            options={currencyOptions}
          />

          <FormField
            label="الفرع"
            name="branch"
            type="select"
            value={branch}
            onChange={(value) => setBranch(value as string)}
            options={branchOptions}
          />
        </div>
      </div>

      {/* Report Content */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-gray-600 ml-2" />
            <h3 className="text-xl font-semibold text-gray-900">
              {reportTypes.find(r => r.id === activeReport)?.title}
            </h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 ml-1" />
            {new Date(dateFrom).toLocaleDateString('ar-LY')} - {new Date(dateTo).toLocaleDateString('ar-LY')}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-3 text-gray-600">جاري تحميل التقرير...</span>
          </div>
        ) : (
          <div>
            {activeReport === 'opening-trial-balance' && <OpeningTrialBalanceReport />}
            {activeReport === 'trial-balance' && renderTrialBalance()}
            {activeReport === 'income-statement' && renderIncomeStatement()}
            {activeReport === 'balance-sheet' && renderBalanceSheet()}
            {activeReport === 'cash-flow' && renderCashFlow()}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
