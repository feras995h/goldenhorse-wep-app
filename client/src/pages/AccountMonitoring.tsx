import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Search, X, Calendar } from 'lucide-react';
import { financialAPI } from '../services/api';
import { Modal } from '../components/UI/Modal';
import { Account } from '../types/financial';

interface MonitoredAccount {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  threshold: number;
  alertOnIncrease: boolean;
  alertOnDecrease: boolean;
  lastBalance: number;
  currentBalance: number;
  changeAmount: number;
  changePercent: number;
  lastUpdated: string;
}

const AccountMonitoring: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [monitoredAccounts, setMonitoredAccounts] = useState<MonitoredAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    loadAccounts();
    loadMonitoredAccounts();
  }, []);

  // تحديث البيانات عند تغيير الفترة الزمنية
  useEffect(() => {
    if (monitoredAccounts.length > 0) {
      loadMonitoredAccounts();
    }
  }, [selectedPeriod]);

  const loadAccounts = async () => {
    try {
      const response = await financialAPI.getAccounts({ limit: 1000 });
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  };

  const loadMonitoredAccounts = async () => {
    try {
      setLoading(true);
      const response = await financialAPI.getMonitoredAccounts();
      setMonitoredAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading monitored accounts:', error);
      setMonitoredAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const addAccountsToMonitoring = () => {
    setIsModalOpen(true);
  };

  const saveSelectedAccounts = async () => {
    try {
      // إضافة الحسابات المختارة للمراقبة
      for (const accountId of selectedAccountIds) {
        const account = accounts.find(acc => acc.id === accountId);
        if (account) {
          const monitoredAccountData = {
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name
          };
          await financialAPI.createMonitoredAccount(monitoredAccountData);
        }
      }

      resetModalState();
      setIsModalOpen(false);
      loadMonitoredAccounts();
    } catch (error) {
      console.error('Error adding accounts to monitoring:', error);
    }
  };

  const removeAccountFromMonitoring = async (accountId: string) => {
    // العثور على الحساب للحصول على اسمه
    const account = monitoredAccounts.find(acc => acc.id === accountId);
    const accountName = account ? account.accountName : 'الحساب';

    if (!confirm(`هل أنت متأكد من إزالة "${accountName}" من المراقبة؟\n\nسيتم إيقاف مراقبة التغيرات لهذا الحساب.`)) return;

    try {
      await financialAPI.deleteMonitoredAccount(accountId);

      // تحديث القائمة فوراً لإزالة الحساب من الواجهة
      setMonitoredAccounts(prev => prev.filter(acc => acc.id !== accountId));

      // إعادة تحميل البيانات للتأكد من التحديث
      loadMonitoredAccounts();

      // إظهار رسالة نجاح
      alert(`تم إزالة "${accountName}" من المراقبة بنجاح`);
    } catch (error) {
      console.error('Error removing account from monitoring:', error);
      alert(`حدث خطأ في إزالة "${accountName}" من المراقبة`);

      // إعادة تحميل البيانات في حالة الخطأ
      loadMonitoredAccounts();
    }
  };

  const refreshMonitoredAccounts = () => {
    loadMonitoredAccounts();
  };

  const resetModalState = () => {
    setSearchQuery('');
    setSelectedAccountIds([]);
  };

  // دالة للحصول على تواريخ الفترة المحددة
  const getPeriodDates = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };

      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          from: startOfWeek,
          to: new Date(endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1)
        };

      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          from: startOfMonth,
          to: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1)
        };

      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
        return {
          from: startOfQuarter,
          to: new Date(endOfQuarter.getTime() + 24 * 60 * 60 * 1000 - 1)
        };

      case 'year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return {
          from: startOfYear,
          to: new Date(endOfYear.getTime() + 24 * 60 * 60 * 1000 - 1)
        };

      default:
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
    }
  };

  // دالة للحصول على تسمية الفترة
  const getPeriodLabel = (period: string) => {
    const labels = {
      today: 'اليوم',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      quarter: 'هذا الربع',
      year: 'هذا العام'
    };
    return labels[period as keyof typeof labels] || 'اليوم';
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري'
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  // دالة تصفية الحسابات بناءً على البحث
  const filteredAccounts = accounts
    .filter(account => !monitoredAccounts.some(ma => ma.id === account.id))
    .filter(account => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        account.name.toLowerCase().includes(query) ||
        account.code.toLowerCase().includes(query) ||
        (account.nameEn && account.nameEn.toLowerCase().includes(query))
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">مراقبة الحسابات</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                مراقبة حركة الحسابات المهمة - {getPeriodLabel(selectedPeriod)}
              </p>
            </div>

            {/* فلتر الفترة الزمنية */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">الفترة الزمنية:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-golden-500 focus:border-golden-500"
                >
                  <option value="today">اليوم</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="quarter">هذا الربع</option>
                  <option value="year">هذا العام</option>
                </select>
              </div>

                <div className="flex gap-2">
                  <button
                    onClick={addAccountsToMonitoring}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-golden-600 hover:bg-golden-700"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة حسابات للمراقبة
                  </button>
                  <button
                    onClick={refreshMonitoredAccounts}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    تحديث
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* معلومات الفترة */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                عرض التغيرات للفترة: {getPeriodLabel(selectedPeriod)}
              </span>
            </div>
            <div className="text-sm text-blue-600">
              {(() => {
                const dates = getPeriodDates(selectedPeriod);
                return `${dates.from.toLocaleDateString('ar-LY')} - ${dates.to.toLocaleDateString('ar-LY')}`;
              })()}
            </div>
          </div>
        </div>

        {/* Monitoring Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">الحسابات المراقبة</p>
                <p className="text-2xl font-bold text-gray-900">{monitoredAccounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">زيادة في الأرصدة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitoredAccounts.filter(acc => acc.changeAmount > 0).length}
                </p>
                <p className="text-xs text-gray-500">{getPeriodLabel(selectedPeriod)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">انخفاض في الأرصدة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monitoredAccounts.filter(acc => acc.changeAmount < 0).length}
                </p>
                <p className="text-xs text-gray-500">{getPeriodLabel(selectedPeriod)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monitored Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">الحسابات المراقبة</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">جاري التحميل...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحساب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الرصيد الحالي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التغيير
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التكرار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      آخر تحديث
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monitoredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <Eye className="h-12 w-12 text-gray-300" />
                          <div className="text-gray-500">
                            <p className="text-lg font-medium">لا توجد حسابات مراقبة</p>
                            <p className="text-sm mt-1">قم بإضافة حسابات للمراقبة لعرض التغيرات والإحصائيات</p>
                          </div>
                          <button
                            onClick={addAccountsToMonitoring}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-golden-600 hover:bg-golden-700"
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة حسابات للمراقبة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    monitoredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {account.accountName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {account.accountCode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                          {(account.currentBalance || 0).toLocaleString()} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getChangeIcon(account.changeAmount || 0)}
                            <span className={`mr-2 text-sm font-medium ${getChangeColor(account.changeAmount || 0)}`}>
                              {(account.changeAmount || 0) > 0 ? '+' : ''}{(account.changeAmount || 0).toLocaleString()} LYD
                            </span>
                            <span className={`text-xs ${getChangeColor(account.changePercent || 0)}`}>
                              ({(account.changePercent || 0) > 0 ? '+' : ''}{(account.changePercent || 0).toFixed(2)}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getFrequencyLabel(account.frequency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                          {(account.threshold || 0).toLocaleString()} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(account.lastUpdated).toLocaleDateString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => removeAccountFromMonitoring(account.id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                          >
                            <Trash2 className="h-4 w-4 ml-1" />
                            إزالة
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* نافذة اختيار الحسابات */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetModalState();
        }}
        title="إضافة حسابات للمراقبة"
      >
        <div className="space-y-4">
          {/* حقل البحث */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center hover:text-gray-600"
                  type="button"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              <input
                type="text"
                placeholder="البحث في الحسابات (الاسم أو الكود)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                className={`block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-golden-500 focus:border-golden-500 text-sm ${
                  searchQuery ? 'pl-10' : 'pl-3'
                }`}
                autoFocus
              />
            </div>
            {searchQuery.trim() && (
              <div className="text-sm text-gray-600">
                عرض {filteredAccounts.length} من أصل {accounts.filter(account => !monitoredAccounts.some(ma => ma.accountId === account.id)).length} حساب
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">
                  {searchQuery.trim() ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>لا توجد حسابات تطابق البحث "{searchQuery}"</p>
                      <p className="text-sm mt-1">جرب البحث بكلمات أخرى</p>
                    </>
                  ) : (
                    <>
                      <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>جميع الحسابات مضافة للمراقبة</p>
                      <p className="text-sm mt-1">لا توجد حسابات أخرى متاحة للإضافة</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <div key={account.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`account-${account.id}`}
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAccountIds([...selectedAccountIds, account.id]);
                      } else {
                        setSelectedAccountIds(selectedAccountIds.filter(id => id !== account.id));
                      }
                    }}
                    className="h-4 w-4 text-golden-600 focus:ring-golden-500 border-gray-300 rounded ml-3"
                  />
                  <label htmlFor={`account-${account.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">كود: {account.code}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {(account.balance || 0).toLocaleString('ar-LY')} د.ل
                        </div>
                        <div className="text-xs text-gray-500">{account.type}</div>
                      </div>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetModalState();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              onClick={saveSelectedAccounts}
              disabled={selectedAccountIds.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-golden-600 border border-transparent rounded-md hover:bg-golden-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إضافة ({selectedAccountIds.length})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountMonitoring;
