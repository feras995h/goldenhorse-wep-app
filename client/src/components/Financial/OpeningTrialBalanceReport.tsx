import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Download, Printer, RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import { financialAPI } from '../../services/api';
import ExportButton from './ExportButton';
import { formatCurrency } from '../../utils/formatters';

interface OpeningTrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  rootType: string;
  accountCategory: string;
  debitBalance: number;
  creditBalance: number;
  netBalance: number;
  displayDebit: number;
  displayCredit: number;
}

interface OpeningTrialBalanceData {
  asOfDate: string;
  currency: string;
  accounts: OpeningTrialBalanceAccount[];
  groupedAccounts: Record<string, OpeningTrialBalanceAccount[]>;
  totals: {
    totalDebit: number;
    totalCredit: number;
    difference: number;
    isBalanced: boolean;
  };
  summary: {
    totalAccounts: number;
    accountsWithBalance: number;
    generatedAt: string;
  };
}

interface OpeningTrialBalanceReportProps {
  onClose?: () => void;
}

const OpeningTrialBalanceReport: React.FC<OpeningTrialBalanceReportProps> = ({ onClose }) => {
  const [data, setData] = useState<OpeningTrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('LYD');
  const [branch, setBranch] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  useEffect(() => {
    generateReport();
  }, [asOfDate, currency, branch]);

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getOpeningTrialBalance({
        asOfDate,
        currency,
        branch: branch || undefined
      });
      setData(response.data);
    } catch (error) {
      console.error('Error generating opening trial balance:', error);
      alert('حدث خطأ أثناء إنشاء ميزان المراجعة الافتتاحي');
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'الأصول',
      liability: 'الخصوم',
      equity: 'حقوق الملكية',
      revenue: 'الإيرادات',
      expense: 'المصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      asset: 'text-blue-600 bg-blue-50',
      liability: 'text-red-600 bg-red-50',
      equity: 'text-purple-600 bg-purple-50',
      revenue: 'text-green-600 bg-green-50',
      expense: 'text-orange-600 bg-orange-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const exportData = () => {
    if (!data) return { columns: [], rows: [] };
    
    const columns = [
      { key: 'code', title: 'رقم الحساب', align: 'right' as const },
      { key: 'name', title: 'اسم الحساب', align: 'right' as const },
      { key: 'type', title: 'نوع الحساب', align: 'right' as const },
      { key: 'debit', title: 'المدين', align: 'left' as const, format: 'currency' as const },
      { key: 'credit', title: 'الدائن', align: 'left' as const, format: 'currency' as const },
      { key: 'balance', title: 'الرصيد الصافي', align: 'left' as const, format: 'currency' as const }
    ];
    
    const rows = data.accounts.map(account => ({
      code: account.code,
      name: account.name,
      type: getAccountTypeLabel(account.type),
      debit: account.displayDebit,
      credit: account.displayCredit,
      balance: account.netBalance
    }));
    
    return { columns, rows };
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 space-x-reverse">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">جاري إنشاء التقرير...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-600 ml-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ميزان المراجعة الافتتاحي</h1>
            <p className="text-gray-600">الأرصدة الافتتاحية للحسابات</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grouped' ? 'flat' : 'grouped')}
            className="btn-secondary"
          >
            {viewMode === 'grouped' ? 'عرض مسطح' : 'عرض مجمع'}
          </button>
          
          <button
            onClick={printReport}
            className="btn-secondary flex items-center"
          >
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </button>
          
          <ExportButton
            data={{
              columns: [
                { key: 'accountNumber', title: 'رقم الحساب' },
                { key: 'accountName', title: 'اسم الحساب' },
                { key: 'accountType', title: 'نوع الحساب' },
                { key: 'debit', title: 'المدين' },
                { key: 'credit', title: 'الدائن' },
                { key: 'netBalance', title: 'الرصيد الصافي' }
              ],
              rows: exportData().rows.map((item: any) => ({
                accountNumber: item.code,
                accountName: item.name,
                accountType: item.type,
                debit: item.debit,
                credit: item.credit,
                netBalance: item.balance
              }))
            }}
            filename={`opening-trial-balance-${asOfDate}`}
            title="ميزان المراجعة الافتتاحي"
            subtitle={`كما في ${new Date(asOfDate).toLocaleDateString('ar-EG')}`}
          />
          
          <button
            onClick={generateReport}
            className="btn-primary flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كما في تاريخ
            </label>
            <div className="relative">
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="input pr-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العملة
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input"
            >
              <option value="LYD">دينار ليبي (LYD)</option>
              <option value="USD">دولار أمريكي (USD)</option>
              <option value="EUR">يورو (EUR)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفرع (اختياري)
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="جميع الفروع"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      {data && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="text-center print:block hidden">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ميزان المراجعة الافتتاحي</h1>
            <p className="text-gray-600">كما في {new Date(data.asOfDate).toLocaleDateString('ar-EG')}</p>
            <p className="text-sm text-gray-500">تم الإنشاء في {new Date(data.summary.generatedAt).toLocaleString('ar-EG')}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
            <div className="card p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg ml-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الحسابات</p>
                  <p className="text-xl font-semibold text-gray-900">{data.summary.totalAccounts}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg ml-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">حسابات لها أرصدة</p>
                  <p className="text-xl font-semibold text-gray-900">{data.summary.accountsWithBalance}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg ml-3">
                  <Download className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي المدين</p>
                  <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.totals.totalDebit, currency)}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ml-3 ${data.totals.isBalanced ? 'bg-green-100' : 'bg-red-100'}`}>
                  {data.totals.isBalanced ? (
                    <BarChart3 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الدائن</p>
                  <p className="text-xl font-semibold text-gray-900">{formatCurrency(data.totals.totalCredit, currency)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Status */}
          {!data.totals.isBalanced && (
            <div className="card p-4 border-red-200 bg-red-50">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                <div>
                  <p className="text-red-800 font-medium">تحذير: الميزان غير متوازن</p>
                  <p className="text-red-600 text-sm">
                    الفرق: {formatCurrency(Math.abs(data.totals.difference), currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Accounts Table */}
          <div className="card overflow-hidden">
            {viewMode === 'grouped' ? (
              // Grouped View
              <div className="space-y-6">
                {Object.entries(data.groupedAccounts).map(([type, accounts]) => (
                  <div key={type}>
                    <div className={`px-4 py-2 ${getAccountTypeColor(type)} border-b`}>
                      <h3 className="font-semibold">{getAccountTypeLabel(type)}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الحساب</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الحساب</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدين</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدائن</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {accounts.map((account) => (
                            <tr key={account.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.code}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{account.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-left">
                                {account.displayDebit > 0 ? formatCurrency(account.displayDebit, currency) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-left">
                                {account.displayCredit > 0 ? formatCurrency(account.displayCredit, currency) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Flat View
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الحساب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الحساب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الحساب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدين</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدائن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{account.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${getAccountTypeColor(account.type)}`}>
                            {getAccountTypeLabel(account.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-left">
                          {account.displayDebit > 0 ? formatCurrency(account.displayDebit, currency) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-left">
                          {account.displayCredit > 0 ? formatCurrency(account.displayCredit, currency) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="border-t bg-gray-50 px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">الإجماليات:</span>
                <div className="flex space-x-8 space-x-reverse">
                  <div className="text-left">
                    <span className="text-sm text-gray-600">المدين: </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(data.totals.totalDebit, currency)}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-sm text-gray-600">الدائن: </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(data.totals.totalCredit, currency)}</span>
                  </div>
                  <div className="text-left">
                    <span className={`text-sm ${data.totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {data.totals.isBalanced ? 'متوازن ✓' : `فرق: ${formatCurrency(Math.abs(data.totals.difference), currency)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpeningTrialBalanceReport;
