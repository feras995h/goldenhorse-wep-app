import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Printer, Eye, BarChart3, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { financialAPI } from '../../services/api';
import { useFinancialUpdates } from '../../hooks/useWebSocket';
import { BalanceUpdate } from '../../services/websocketService';

interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  level: number;
  isGroup: boolean;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  children?: TrialBalanceAccount[];
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    difference: number;
  };
  asOfDate: string;
  generatedAt: string;
}

interface DynamicTrialBalanceProps {
  asOfDate?: string;
  showHierarchy?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const DynamicTrialBalance: React.FC<DynamicTrialBalanceProps> = ({
  asOfDate,
  showHierarchy = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // WebSocket connection for real-time updates
  const { isConnected } = useFinancialUpdates({
    onBalanceUpdate: (balanceUpdate: BalanceUpdate) => {
      console.log('Trial Balance - Balance update received:', balanceUpdate);
      // Refresh trial balance when any balance changes
      if (autoRefresh) {
        setTimeout(() => {
          loadTrialBalance();
        }, 1000); // Small delay to ensure all related updates are processed
      }
    },
    onJournalEntryPosted: () => {
      console.log('Trial Balance - Journal entry posted');
      if (autoRefresh) {
        setTimeout(() => {
          loadTrialBalance();
        }, 1000);
      }
    }
  });

  useEffect(() => {
    loadTrialBalance();
  }, [asOfDate]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadTrialBalance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (asOfDate) params.asOfDate = asOfDate;
      if (showHierarchy) params.includeHierarchy = true;

      const response = await financialAPI.get('/reports/trial-balance', { params });
      
      if (response.data.success) {
        setTrialBalanceData(response.data.data);
        setLastUpdated(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error loading trial balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (accountId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedGroups(newExpanded);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-blue-600';
      case 'liability': return 'text-red-600';
      case 'equity': return 'text-purple-600';
      case 'revenue': return 'text-green-600';
      case 'expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'asset': return 'أصول';
      case 'liability': return 'التزامات';
      case 'equity': return 'حقوق ملكية';
      case 'revenue': return 'إيرادات';
      case 'expense': return 'مصروفات';
      default: return type;
    }
  };

  const filterAccounts = (accounts: TrialBalanceAccount[]): TrialBalanceAccount[] => {
    return accounts.filter(account => {
      const matchesType = filterType === 'all' || account.type === filterType;
      const matchesSearch = searchTerm === '' || 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  };

  const renderAccount = (account: TrialBalanceAccount, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedGroups.has(account.id);
    const indent = level * 20;

    return (
      <React.Fragment key={account.id}>
        <tr className={`hover:bg-gray-50 ${account.isGroup ? 'bg-gray-25 font-medium' : ''}`}>
          <td className="px-6 py-3 text-right" style={{ paddingRight: `${24 + indent}px` }}>
            <div className="flex items-center">
              {hasChildren && (
                <button
                  onClick={() => toggleGroup(account.id)}
                  className="ml-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              <div>
                <div className="font-medium text-gray-900">{account.code}</div>
                <div className="text-sm text-gray-600">{account.name}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-3 text-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)} bg-opacity-10`}>
              {getAccountTypeLabel(account.type)}
            </span>
          </td>
          <td className="px-6 py-3 text-left font-mono">
            {account.debit > 0 ? (isNaN(account.debit) || !isFinite(account.debit) ? 0 : account.debit).toLocaleString('ar-LY') : '-'}
          </td>
          <td className="px-6 py-3 text-left font-mono">
            {account.credit > 0 ? (isNaN(account.credit) || !isFinite(account.credit) ? 0 : account.credit).toLocaleString('ar-LY') : '-'}
          </td>
          <td className={`px-6 py-3 text-left font-mono font-medium ${
            account.balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(isNaN(account.balance) || !isFinite(account.balance) ? 0 : account.balance).toLocaleString('ar-LY')}
          </td>
        </tr>
        
        {hasChildren && isExpanded && account.children?.map(child => 
          renderAccount(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  if (!trialBalanceData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل ميزان المراجعة...</p>
        </div>
      </div>
    );
  }

  const filteredAccounts = filterAccounts(trialBalanceData.accounts);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-6 w-6 text-golden-600 ml-3" />
              ميزان المراجعة
            </h2>
            <p className="text-gray-600 mt-1">
              كما في: {trialBalanceData.asOfDate ? new Date(trialBalanceData.asOfDate).toLocaleDateString('ar-LY') : 'اليوم'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Connection Status */}
            <div className="flex items-center">
              {isConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4 ml-1" />
                  <span className="text-sm">متصل</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4 ml-1" />
                  <span className="text-sm">غير متصل</span>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadTrialBalance}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>

            {/* Export Button */}
            <button className="flex items-center px-3 py-2 text-sm font-medium text-white bg-golden-600 rounded-md hover:bg-golden-700">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في الحسابات..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
            >
              <option value="all">كل الأنواع</option>
              <option value="asset">الأصول</option>
              <option value="liability">الالتزامات</option>
              <option value="equity">حقوق الملكية</option>
              <option value="revenue">الإيرادات</option>
              <option value="expense">المصروفات</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">إجمالي المدين</div>
            <div className="text-2xl font-bold text-green-700">
              {(isNaN(trialBalanceData.totals.totalDebits) || !isFinite(trialBalanceData.totals.totalDebits) ? 0 : trialBalanceData.totals.totalDebits).toLocaleString('ar-LY')}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-red-600 font-medium">إجمالي الدائن</div>
            <div className="text-2xl font-bold text-red-700">
              {(isNaN(trialBalanceData.totals.totalCredits) || !isFinite(trialBalanceData.totals.totalCredits) ? 0 : trialBalanceData.totals.totalCredits).toLocaleString('ar-LY')}
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            Math.abs(trialBalanceData.totals.difference) < 0.01 ? 'bg-green-50' : 'bg-yellow-50'
          }`}>
            <div className={`text-sm font-medium ${
              Math.abs(trialBalanceData.totals.difference) < 0.01 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              الفرق
            </div>
            <div className={`text-2xl font-bold ${
              Math.abs(trialBalanceData.totals.difference) < 0.01 ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {(isNaN(trialBalanceData.totals.difference) || !isFinite(trialBalanceData.totals.difference) ? 0 : trialBalanceData.totals.difference).toLocaleString('ar-LY')}
            </div>
          </div>
        </div>

        {lastUpdated && (
          <div className="text-xs text-gray-500 mt-2">
            آخر تحديث: {new Date(lastUpdated).toLocaleString('ar-LY')}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحساب
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                النوع
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                مدين
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                دائن
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الرصيد
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.map(account => renderAccount(account))}
          </tbody>
        </table>
      </div>

      {filteredAccounts.length === 0 && (
        <div className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حسابات</h3>
          <p className="text-gray-600">لا توجد حسابات تطابق معايير البحث المحددة</p>
        </div>
      )}
    </div>
  );
};

export default DynamicTrialBalance;
