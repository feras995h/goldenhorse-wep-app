import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  FileText,
  Download,
  Printer,
  ArrowLeft,
  Filter,
  RefreshCw
} from 'lucide-react';
import { financialAPI } from '../services/api';
import { printAccountStatement } from '../utils/printUtils';

interface Account {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  type: string;
  parentId?: string;
  level: number;
}

interface AccountStatement {
  accountInfo: {
    accountId: string;
    accountCode: string;
    accountName: string;
  };
  entries: Array<{
    id: string;
    postingDate: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    voucherType: string;
    voucherNo: string;
    party?: string;
  }>;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

const AccountStatement: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);

  useEffect(() => {
    loadAccounts();
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    
    if (searchTerm.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account =>
        (account.name && account.name.includes(searchTerm)) ||
        (account.code && account.code.includes(searchTerm)) ||
        (account.nameEn && account.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, accounts]);

  const loadAccounts = async () => {
    try {
      const data = await financialAPI.getAccounts();
      setAccounts(data);
      setFilteredAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const generateStatement = async () => {
    if (!selectedAccount || !fromDate || !toDate) {
      alert('يرجى اختيار الحساب وتحديد الفترة');
      return;
    }

    setLoading(true);
    try {
      const data = await financialAPI.getAccountStatement(selectedAccount, {
        fromDate,
        toDate
      });
      setStatement(data);
    } catch (error) {
      console.error('Error generating statement:', error);
      alert('حدث خطأ في إنشاء كشف الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (statement) {
      const printData = {
        accountName: statement.accountInfo.accountName,
        accountCode: statement.accountInfo.accountCode,
        period: `${fromDate} إلى ${toDate}`,
        openingBalance: statement.openingBalance,
        closingBalance: statement.closingBalance,
        totalDebit: statement.totalDebit,
        totalCredit: statement.totalCredit,
        currency: 'LYD',
        transactions: statement.entries.map(entry => ({
          date: entry.postingDate,
          description: entry.description,
          type: entry.debit > 0 ? 'receipt' : 'payment',
          amount: entry.debit > 0 ? entry.debit : entry.credit,
          balance: entry.balance
        }))
      };
      printAccountStatement(printData);
    }
  };

  const handleExport = () => {
    if (statement) {
      // Export to CSV
      const csvContent = generateCSV(statement);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `كشف_حساب_${statement.accountInfo.accountCode}_${fromDate}_${toDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generateCSV = (data: AccountStatement) => {
    const headers = ['التاريخ', 'الوصف', 'المدين', 'الدائن', 'الرصيد'];
    const rows = data.entries.map(entry => [
      new Date(entry.postingDate).toLocaleDateString('ar-LY'),
      entry.description,
      entry.debit > 0 ? entry.debit : '',
      entry.credit > 0 ? entry.credit : '',
      entry.balance
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LY', {
      style: 'currency',
      currency: 'LYD'
    }).format(amount);
  };

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">كشف حساب دفتر الأستاذ</h1>
              <p className="text-gray-600">عرض تفاصيل حركة الحساب خلال فترة محددة</p>
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

      {/* Filters Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">معايير البحث</h2>
          <Filter className="h-5 w-5 text-gray-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختيار الحساب
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الحسابات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-transparent"
              />
            </div>
            {searchTerm && filteredAccounts.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account.id);
                      setSearchTerm(account.name || '');
                    }}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{account.name || 'بدون اسم'}</div>
                    <div className="text-sm text-gray-500">{account.code || 'بدون رمز'}</div>
                  </div>
                ))}
              </div>
            )}
            {searchTerm && filteredAccounts.length === 0 && (
              <div className="mt-2 p-3 text-center text-gray-500 border border-gray-200 rounded-lg">
                لا توجد حسابات مطابقة
              </div>
            )}
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateStatement}
              disabled={loading || !selectedAccount}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <FileText className="h-4 w-4 ml-2" />
              )}
              إنشاء الكشف
            </button>
          </div>
        </div>
      </div>

      {/* Statement Results */}
      {statement && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                كشف حساب: {statement.accountInfo.accountName}
              </h2>
              <p className="text-sm text-gray-600">
                رمز الحساب: {statement.accountInfo.accountCode}
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleExport}
                className="btn btn-outline btn-sm"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-outline btn-sm"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600">الرصيد الافتتاحي</div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(statement.openingBalance)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600">إجمالي المدين</div>
              <div className="text-lg font-bold text-green-900">
                {formatCurrency(statement.totalDebit)}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-600">إجمالي الدائن</div>
              <div className="text-lg font-bold text-red-900">
                {formatCurrency(statement.totalCredit)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600">الرصيد الختامي</div>
              <div className="text-lg font-bold text-purple-900">
                {formatCurrency(statement.closingBalance)}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right font-medium text-gray-700">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">الوصف</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">المدين</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">الدائن</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {statement.entries.map((entry, index) => (
                  <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(entry.postingDate).toLocaleDateString('ar-LY')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{entry.description}</div>
                      <div className="text-xs text-gray-500">
                        {entry.voucherType} - {entry.voucherNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {formatCurrency(entry.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {statement.entries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد حركات لهذا الحساب خلال الفترة المحددة
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountStatement;
