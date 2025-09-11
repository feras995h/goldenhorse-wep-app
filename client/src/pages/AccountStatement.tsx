import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Printer, Eye } from 'lucide-react';
import { financialAPI } from '../services/api';
import { SearchFilter } from '../components/UI/SearchFilter';
import { Modal } from '../components/UI/Modal';
import { Account, JournalEntry } from '../types/financial';

interface AccountStatementEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  entryNumber: string;
}

const AccountStatement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [statementEntries, setStatementEntries] = useState<AccountStatementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  // Account search states
  const [accountSearchResults, setAccountSearchResults] = useState<Account[]>([]);
  const [searchingAccount, setSearchingAccount] = useState<string>('');

  useEffect(() => {
    loadAccounts();
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await financialAPI.getAccounts({ limit: 1000 });
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    }
  };

  const searchAccounts = async (searchTerm: string, searchField: 'accountCode' | 'accountName') => {
    if (searchTerm.length < 1) {
      setAccountSearchResults([]);
      return;
    }

    try {
      setSearchingAccount(searchField);
      const response = await financialAPI.getAccounts({
        search: searchTerm,
        limit: 10
      });
      setAccountSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching accounts:', error);
      setAccountSearchResults([]);
    }
  };

  const selectAccount = (account: Account) => {
    setSelectedAccount(account);
    setAccountSearchResults([]);
    setSearchingAccount('');
    // Auto-load statement when account is selected
    setTimeout(() => {
      loadAccountStatement();
    }, 100);
  };

  const clearSelectedAccount = () => {
    setSelectedAccount(null);
    setStatementEntries([]);
    setOpeningBalance(0);
    setClosingBalance(0);
    setAccountSearchResults([]);
    setSearchingAccount('');
  };

  const loadAccountStatement = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      
      const params: any = {
        accountId: selectedAccount.id,
        dateFrom: showAllPeriods ? undefined : dateFrom,
        dateTo: showAllPeriods ? undefined : dateTo
      };

      const response = await financialAPI.getAccountStatement(params);
      
      // Process the response to create statement entries
      const entries: AccountStatementEntry[] = [];
      let runningBalance = showAllPeriods ? 0 : (response.openingBalance || 0);
      
      if (response.entries) {
        response.entries.forEach((entry: any) => {
          const debit = entry.debit || 0;
          const credit = entry.credit || 0;
          runningBalance += debit - credit;
          
          entries.push({
            date: entry.date,
            description: entry.description || entry.journalEntry?.description || '',
            reference: entry.journalEntry?.entryNumber || '',
            debit,
            credit,
            balance: runningBalance,
            entryNumber: entry.journalEntry?.entryNumber || ''
          });
        });
      }

      setStatementEntries(entries);
      setOpeningBalance(response.openingBalance || 0);
      setClosingBalance(runningBalance);
    } catch (error) {
      console.error('Error loading account statement:', error);
      setStatementEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      loadAccountStatement();
    }
  }, [selectedAccount, dateFrom, dateTo, showAllPeriods]);

  const exportStatement = () => {
    if (!selectedAccount) return;

    const csvContent = [
      [`كشف حساب: ${selectedAccount.name} (${selectedAccount.code})`],
      [`الفترة من: ${dateFrom} إلى: ${dateTo}`],
      [''],
      ['التاريخ', 'البيان', 'المرجع', 'مدين', 'دائن', 'الرصيد'],
      ...statementEntries.map(entry => [
        new Date(entry.date).toLocaleDateString('ar-LY'),
        entry.description,
        entry.reference,
        entry.debit.toLocaleString(),
        entry.credit.toLocaleString(),
        entry.balance.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `account_statement_${selectedAccount.code}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printStatement = () => {
    window.print();
  };

  const filterOptions = [
    {
      key: 'showAllPeriods',
      label: 'الفترة',
      value: showAllPeriods ? 'all' : 'custom',
      options: [
        { value: 'custom', label: 'فترة محددة' },
        { value: 'all', label: 'كل الفترات' }
      ],
      onChange: (value: string) => setShowAllPeriods(value === 'all')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">كشف الحساب</h1>
              <p className="text-gray-600 mt-1">عرض تفاصيل حركة الحساب خلال فترة محددة</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={printStatement}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </button>
              <button
                onClick={exportStatement}
                disabled={!selectedAccount}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Account Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحساب
              </label>
              <div className="space-y-2">
                {selectedAccount ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      <div className="font-medium">{selectedAccount.code} - {selectedAccount.name}</div>
                    </div>
                    <button
                      onClick={clearSelectedAccount}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        onChange={(e) => searchAccounts(e.target.value, 'accountCode')}
                        placeholder="رقم الحساب"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                      />
                      {searchingAccount === 'accountCode' && accountSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {accountSearchResults.map((account) => (
                            <div
                              key={account.id}
                              onClick={() => selectAccount(account)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              <div className="font-medium">{account.code}</div>
                              <div className="text-gray-600">{account.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        onChange={(e) => searchAccounts(e.target.value, 'accountName')}
                        placeholder="اسم الحساب"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                      />
                      {searchingAccount === 'accountName' && accountSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {accountSearchResults.map((account) => (
                            <div
                              key={account.id}
                              onClick={() => selectAccount(account)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              <div className="font-medium">{account.name}</div>
                              <div className="text-gray-600">{account.code}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Periods Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showAllPeriods"
                checked={showAllPeriods}
                onChange={(e) => setShowAllPeriods(e.target.checked)}
                className="h-4 w-4 text-golden-600 focus:ring-golden-500 border-gray-300 rounded"
              />
              <label htmlFor="showAllPeriods" className="mr-2 block text-sm font-medium text-gray-700">
                كل الفترات
              </label>
            </div>

            {/* Date Range */}
            {!showAllPeriods && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Period Filter */}
          <div className="mt-4">
            <SearchFilter
              searchValue=""
              onSearchChange={() => {}}
              filters={filterOptions}
              onClearFilters={() => setShowAllPeriods(false)}
            />
          </div>
        </div>

        {/* Account Statement */}
        {selectedAccount && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Statement Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedAccount.name}
                  </h2>
                  <p className="text-gray-600">رقم الحساب: {selectedAccount.code}</p>
                  <p className="text-gray-600">
                    الفترة: {showAllPeriods ? 'كل الفترات' : `${dateFrom} - ${dateTo}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">الرصيد الافتتاحي</div>
                  <div className={`text-lg font-bold ${openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {openingBalance.toLocaleString()} {selectedAccount.currency}
                  </div>
                </div>
              </div>
            </div>

            {/* Statement Table */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري تحميل كشف الحساب...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التاريخ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        البيان
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المرجع
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
                    {statementEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          لا توجد حركة للحساب في الفترة المحددة
                        </td>
                      </tr>
                    ) : (
                      statementEntries.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString('ar-LY')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                            {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                            {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-left">
                            <span className={entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {entry.balance.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Statement Footer */}
            {statementEntries.length > 0 && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    إجمالي الحركة: {statementEntries.length} قيد
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">الرصيد الختامي</div>
                    <div className={`text-lg font-bold ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {closingBalance.toLocaleString()} {selectedAccount.currency}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Account Selected */}
        {!selectedAccount && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">اختر حساب لعرض كشف الحساب</h3>
            <p className="text-gray-600">ابحث عن الحساب بالرقم أو الاسم لعرض تفاصيل حركته</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountStatement;
