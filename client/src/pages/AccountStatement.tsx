import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Download, Printer, Eye, FileText, FileSpreadsheet, ChevronDown, Edit, ExternalLink, Receipt, CreditCard, Plus, Wifi, WifiOff } from 'lucide-react';
import { financialAPI } from '../services/api';
import { SearchFilter } from '../components/UI/SearchFilter';
import { Modal } from '../components/UI/Modal';
import { Account, JournalEntry } from '../types/financial';
import ReceiptVoucher from '../components/Financial/ReceiptVoucher';
import PaymentVoucher from '../components/Financial/PaymentVoucher';
import { useAccountBalance } from '../hooks/useWebSocket';
import { BalanceUpdate } from '../services/websocketService';
import '../styles/AccountStatement.css';

interface AccountStatementEntry {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  entryNumber: string;
  // Precise navigation helpers
  journalEntryId?: string; // for Journal Entry
  voucherType?: string;    // e.g., 'Journal Entry', 'Opening Balance', 'Receipt', 'Payment'
  voucherNo?: string;
  // Backward compatibility
  entryId?: string;
  entryType?: string;
  isOpeningBalance?: boolean;
}

const AccountStatement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const navigate = useNavigate();

  const [statementEntries, setStatementEntries] = useState<AccountStatementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAllPeriods, setShowAllPeriods] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AccountStatementEntry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);

  // Account search states
  const [accountSearchResults, setAccountSearchResults] = useState<Account[]>([]);
  const [searchingAccount, setSearchingAccount] = useState<string>('');

  // Voucher states
  const [showReceiptVoucher, setShowReceiptVoucher] = useState(false);
  const [showPaymentVoucher, setShowPaymentVoucher] = useState(false);
  const [availableActions, setAvailableActions] = useState<any[]>([]);

  // Real-time balance updates
  const [realTimeBalance, setRealTimeBalance] = useState<number | null>(null);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<string | null>(null);

  // WebSocket connection for real-time updates
  const { isConnected } = useAccountBalance(
    selectedAccount?.id || '',
    (balanceUpdate: BalanceUpdate) => {
      console.log('Balance update received:', balanceUpdate);
      setRealTimeBalance(balanceUpdate.newBalance);
      setLastBalanceUpdate(balanceUpdate.timestamp);

      // Refresh account statement if this account's balance changed
      if (balanceUpdate.accountId === selectedAccount?.id) {
        setTimeout(() => {
          loadAccountStatement();
        }, 500); // Small delay to ensure backend is updated
      }
    }
  );

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
    // Load available actions for this account
    loadAccountActions(account.id);
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
    setAvailableActions([]);
  };

  const loadAccountActions = async (accountId: string) => {
    try {
      const response = await financialAPI.get(`/accounts/${accountId}/statement-actions`);
      if (response.data.success) {
        setAvailableActions(response.data.data.actions || []);
      }
    } catch (error) {
      console.error('Error loading account actions:', error);
      setAvailableActions([]);
    }
  };

  const handleVoucherSuccess = () => {
    // Reload the account statement after successful voucher creation
    loadAccountStatement();
  };

  const openReceiptVoucher = () => {
    setShowReceiptVoucher(true);
  };

  const openPaymentVoucher = () => {
    setShowPaymentVoucher(true);
  };

  const loadAccountStatement = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);

      const params: any = {
        fromDate: showAllPeriods ? undefined : dateFrom,
        toDate: showAllPeriods ? undefined : dateTo
      };

      const response = await financialAPI.getAccountStatement(selectedAccount.id, params);

      // Process the response to create statement entries
      const entries: AccountStatementEntry[] = [];
      const openingBalance = response.totals?.openingBalance || 0;
      let runningBalance = showAllPeriods ? 0 : openingBalance;

      // Add opening balance entry if not showing all periods and there's an opening balance
      if (!showAllPeriods && openingBalance !== 0) {
        entries.push({
          date: dateFrom || new Date().toISOString().split('T')[0],
          description: 'الرصيد الافتتاحي',
          reference: 'رصيد افتتاحي',
          debit: openingBalance > 0 ? openingBalance : 0,
          credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
          balance: openingBalance,
          entryNumber: 'OB',
          isOpeningBalance: true
        });
      }

      if (response.entries) {
        response.entries.forEach((entry: any) => {
          const debit = entry.debit || 0;
          const credit = entry.credit || 0;

          // Use the runningBalance from server if available, otherwise calculate
          const balance = entry.runningBalance !== undefined ? entry.runningBalance : (runningBalance + debit - credit);
          runningBalance = balance;

          entries.push({
            date: entry.postingDate || entry.date,
            description: entry.description || entry.journalEntry?.description || '',
            reference: entry.voucherNo || entry.journalEntry?.entryNumber || '',
            debit,
            credit,
            balance,
            entryNumber: entry.journalEntry?.entryNumber || entry.voucherNo || '',
            journalEntryId: entry.journalEntry?.id,
            voucherType: entry.voucherType,
            voucherNo: entry.voucherNo,
            entryId: entry.id,
            entryType: entry.entryType || (entry.voucherType ? entry.voucherType.toLowerCase() : 'journal')
          });
        });
      }

      setStatementEntries(entries);
      setOpeningBalance(openingBalance);
      setClosingBalance(response.totals?.closingBalance || runningBalance);
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

  // Enhanced export functions
  const exportToExcel = () => {
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
        (isNaN(entry.debit) || !isFinite(entry.debit) ? 0 : entry.debit).toLocaleString('ar-LY'),
        (isNaN(entry.credit) || !isFinite(entry.credit) ? 0 : entry.credit).toLocaleString('ar-LY'),
        (isNaN(entry.balance) || !isFinite(entry.balance) ? 0 : entry.balance).toLocaleString('ar-LY')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `account_statement_${selectedAccount.code}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    if (!selectedAccount) return;

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = generatePrintableHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    setShowExportMenu(false);
  };

  const exportToWord = () => {
    if (!selectedAccount) return;

    const htmlContent = generatePrintableHTML();
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `account_statement_${selectedAccount.code}.doc`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Enhanced print function with professional formatting
  const generatePrintableHTML = () => {
    if (!selectedAccount) return '';

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب - ${selectedAccount.name}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 10px;
          }
          .company-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 20px;
          }
          .report-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .account-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .number {
            text-align: left;
          }
          .positive {
            color: #28a745;
          }
          .negative {
            color: #dc3545;
          }
          .footer {
            border-top: 1px solid #ddd;
            padding-top: 15px;
            margin-top: 30px;
            font-size: 10px;
            color: #666;
          }
          .summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">شركة وائل للمحاسبة</div>
          <div class="company-info">
            العنوان: ليبيا - طرابلس | الهاتف: +218-XX-XXXXXXX | البريد الإلكتروني: info@wael-accounting.ly
          </div>
          <div class="report-title">كشف حساب</div>
        </div>

        <div class="account-info">
          <strong>اسم الحساب:</strong> ${selectedAccount.name}<br>
          <strong>رقم الحساب:</strong> ${selectedAccount.code}<br>
          <strong>نوع الحساب:</strong> ${selectedAccount.type}<br>
          <strong>الفترة:</strong> ${showAllPeriods ? 'كل الفترات' : `${dateFrom} - ${dateTo}`}
        </div>

        <div class="summary">
          <strong>الرصيد الافتتاحي:</strong>
          <span class="${openingBalance >= 0 ? 'positive' : 'negative'}">${(isNaN(openingBalance) || !isFinite(openingBalance) ? 0 : openingBalance).toLocaleString('ar-LY')} ${selectedAccount.currency}</span>
          <br>
          <strong>الرصيد الختامي:</strong>
          <span class="${closingBalance >= 0 ? 'positive' : 'negative'}">${(isNaN(closingBalance) || !isFinite(closingBalance) ? 0 : closingBalance).toLocaleString('ar-LY')} ${selectedAccount.currency}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>المرجع</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${statementEntries.map(entry => `
              <tr>
                <td>${new Date(entry.date).toLocaleDateString('ar-LY')}</td>
                <td>${entry.description}</td>
                <td>${entry.reference}</td>
                <td class="number">${entry.debit > 0 ? (isNaN(entry.debit) || !isFinite(entry.debit) ? 0 : entry.debit).toLocaleString('ar-LY') : '-'}</td>
                <td class="number">${entry.credit > 0 ? (isNaN(entry.credit) || !isFinite(entry.credit) ? 0 : entry.credit).toLocaleString('ar-LY') : '-'}</td>
                <td class="number ${entry.balance >= 0 ? 'positive' : 'negative'}">${(isNaN(entry.balance) || !isFinite(entry.balance) ? 0 : entry.balance).toLocaleString('ar-LY')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div style="float: right;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-LY')}</div>
          <div style="float: left;">إجمالي الحركة: ${statementEntries.length} قيد</div>
          <div style="clear: both;"></div>
        </div>
      </body>
      </html>
    `;
  };

  const printStatement = () => {
    const htmlContent = generatePrintableHTML();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Handle entry click for editing
  const handleEntryClick = (entry: AccountStatementEntry) => {
    if (entry.isOpeningBalance) {
      // Opening balance -> go to opening balance page
      navigate('/financial/opening-balance');
      return;
    }

    const id = entry.journalEntryId || entry.entryId;
    if (id) {
      navigate(`/financial/journal?openId=${id}`);
      return;
    }

    // Default fallback
    navigate('/financial/journal');
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">كشف الحساب</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">عرض تفاصيل حركة الحساب خلال فترة محددة</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse w-full sm:w-auto">
              <button
                onClick={printStatement}
                disabled={!selectedAccount}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </button>

              {/* Enhanced Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!selectedAccount}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                  <ChevronDown className="h-4 w-4 mr-1" />
                </button>

                {showExportMenu && selectedAccount && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10 export-menu">
                    <div className="py-1">
                      <button
                        onClick={exportToExcel}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileSpreadsheet className="h-4 w-4 ml-2" />
                        تصدير إلى Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        تصدير إلى PDF
                      </button>
                      <button
                        onClick={exportToWord}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4 ml-2" />
                        تصدير إلى Word
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            {/* Date Range - Improved Layout */}
            <div className="space-y-4 date-range-container">
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

              {!showAllPeriods && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التاريخ من
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 date-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      التاريخ إلى
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500 date-input"
                    />
                  </div>
                </div>
              )}
            </div>
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
              <div className="flex items-center justify-between mb-4">
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
                  <div className="flex items-center justify-end mb-2">
                    <div className="text-sm text-gray-600">الرصيد الافتتاحي</div>
                    {isConnected ? (
                      <Wifi className="h-4 w-4 text-green-500 mr-2" aria-label="متصل - التحديثات الفورية مفعلة" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500 mr-2" aria-label="غير متصل - التحديثات الفورية معطلة" />
                    )}
                  </div>
                  <div className={`text-lg font-bold ${openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(isNaN(openingBalance) || !isFinite(openingBalance) ? 0 : openingBalance).toLocaleString('ar-LY')} {selectedAccount.currency}
                  </div>
                  {realTimeBalance !== null && Math.abs(realTimeBalance - openingBalance) > 0.01 && (
                    <div className="text-xs text-blue-600 mt-1">
                      الرصيد الحالي: {(isNaN(realTimeBalance) || !isFinite(realTimeBalance) ? 0 : realTimeBalance).toLocaleString('ar-LY')} {selectedAccount.currency}
                      {lastBalanceUpdate && (
                        <div className="text-xs text-gray-500">
                          آخر تحديث: {new Date(lastBalanceUpdate).toLocaleTimeString('ar-LY')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {availableActions.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {availableActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        if (action.id === 'receipt') {
                          openReceiptVoucher();
                        } else if (action.id === 'payment') {
                          openPaymentVoucher();
                        }
                      }}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        action.color === 'green'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : action.color === 'red'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {action.id === 'receipt' && <Receipt className="h-4 w-4 ml-2" />}
                      {action.id === 'payment' && <CreditCard className="h-4 w-4 ml-2" />}
                      {action.id === 'outstanding_invoices' && <FileText className="h-4 w-4 ml-2" />}
                      <span>{action.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Statement Table */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">جاري تحميل كشف الحساب...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 account-statement-table">
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
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        مدين
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        دائن
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الرصيد
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statementEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          لا توجد حركة للحساب في الفترة المحددة
                        </td>
                      </tr>
                    ) : (
                      statementEntries.map((entry, index) => (
                        <tr
                          key={index}
                          className={`${!entry.isOpeningBalance ? 'clickable-row' : 'opening-balance-row'}`}
                          onClick={() => !entry.isOpeningBalance && handleEntryClick(entry)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString('ar-LY')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.description}
                            {entry.isOpeningBalance && (
                              <span className="opening-balance-badge mr-2">
                                رصيد افتتاحي
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center number-cell">
                            {entry.debit > 0 ? (
                              <span className="debit-amount">
                                {(isNaN(entry.debit) || !isFinite(entry.debit) ? 0 : entry.debit).toLocaleString('ar-LY')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center number-cell">
                            {entry.credit > 0 ? (
                              <span className="credit-amount">
                                {(isNaN(entry.credit) || !isFinite(entry.credit) ? 0 : entry.credit).toLocaleString('ar-LY')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center number-cell">
                            <span className={`balance-amount ${entry.balance >= 0 ? 'positive-balance' : 'negative-balance'}`}>
                              {(isNaN(entry.balance) || !isFinite(entry.balance) ? 0 : entry.balance).toLocaleString('ar-LY')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            {!entry.isOpeningBalance && (
                              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEntryClick(entry);
                                  }}
                                  className="action-button edit"
                                  title="عرض وتعديل"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to operation in a new tab
                                    if (entry.isOpeningBalance) {
                                      window.open('/financial/opening-balance','_blank');
                                    } else if (entry.journalEntryId || entry.entryId) {
                                      const id = entry.journalEntryId || entry.entryId!;
                                      window.open(`/financial/journal?openId=${id}`,'_blank');
                                    } else {
                                      window.open('/financial/journal','_blank');
                                    }
                                  }}
                                  className="action-button external"
                                  title="فتح في نافذة جديدة"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              </div>
                            )}
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
                      {(isNaN(closingBalance) || !isFinite(closingBalance) ? 0 : closingBalance).toLocaleString('ar-LY')} {selectedAccount.currency}
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

      {/* Entry Details Modal */}
      <Modal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setSelectedEntry(null);
        }}
        title="تفاصيل الحركة"
      >
        {selectedEntry && (
          <div className="space-y-6">
            {/* Entry Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">معلومات الحركة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">التاريخ</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEntry.date).toLocaleDateString('ar-LY')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">رقم المرجع</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEntry.reference}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">البيان</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEntry.description}</p>
                </div>
              </div>
            </div>

            {/* Amount Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="amount-card debit bg-green-50 rounded-lg p-4 hover-lift">
                <h4 className="text-sm font-medium text-green-800 mb-2">المبلغ المدين</h4>
                <p className="text-2xl font-bold text-green-600">
                  {selectedEntry.debit > 0 ? (isNaN(selectedEntry.debit) || !isFinite(selectedEntry.debit) ? 0 : selectedEntry.debit).toLocaleString('ar-LY') : '0'}
                </p>
                <p className="text-sm text-green-600">{selectedAccount?.currency}</p>
              </div>
              <div className="amount-card credit bg-red-50 rounded-lg p-4 hover-lift">
                <h4 className="text-sm font-medium text-red-800 mb-2">المبلغ الدائن</h4>
                <p className="text-2xl font-bold text-red-600">
                  {selectedEntry.credit > 0 ? (isNaN(selectedEntry.credit) || !isFinite(selectedEntry.credit) ? 0 : selectedEntry.credit).toLocaleString('ar-LY') : '0'}
                </p>
                <p className="text-sm text-red-600">{selectedAccount?.currency}</p>
              </div>
              <div className="amount-card balance bg-blue-50 rounded-lg p-4 hover-lift">
                <h4 className="text-sm font-medium text-blue-800 mb-2">الرصيد بعد الحركة</h4>
                <p className={`text-2xl font-bold ${selectedEntry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(isNaN(selectedEntry.balance) || !isFinite(selectedEntry.balance) ? 0 : selectedEntry.balance).toLocaleString('ar-LY')}
                </p>
                <p className="text-sm text-blue-600">{selectedAccount?.currency}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    // Navigate to edit entry
                    window.open(`/journal-entries/${selectedEntry.entryId}/edit`, '_blank');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل الحركة
                </button>
                <button
                  onClick={() => {
                    window.open(`/journal-entries/${selectedEntry.entryId}`, '_blank');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  عرض القيد كاملاً
                </button>
              </div>
              <button
                onClick={() => {
                  setShowEntryModal(false);
                  setSelectedEntry(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowExportMenu(false)}
        />
      )}

      {/* Receipt Voucher Modal */}
      <ReceiptVoucher
        isOpen={showReceiptVoucher}
        onClose={() => setShowReceiptVoucher(false)}
        onSuccess={handleVoucherSuccess}
        accountId={selectedAccount?.id}
        partyType="account"
        partyId={selectedAccount?.id}
      />

      {/* Payment Voucher Modal */}
      <PaymentVoucher
        isOpen={showPaymentVoucher}
        onClose={() => setShowPaymentVoucher(false)}
        onSuccess={handleVoucherSuccess}
        accountId={selectedAccount?.id}
        partyType="account"
        partyId={selectedAccount?.id}
      />
    </div>
  );
};

export default AccountStatement;
