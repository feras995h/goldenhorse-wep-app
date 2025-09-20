import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { salesAPI } from '../services/api';
import { SearchFilter } from '../components/UI/SearchFilter';
import { Invoice } from '../types/financial';

interface InvoiceReport {
  totalInvoices: number;
  totalAmount: number;
  paidInvoices: number;
  paidAmount: number;
  partiallyPaidInvoices: number;
  partiallyPaidAmount: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
}

const InvoiceReports: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [report, setReport] = useState<InvoiceReport>({
    totalInvoices: 0,
    totalAmount: 0,
    paidInvoices: 0,
    paidAmount: 0,
    partiallyPaidInvoices: 0,
    partiallyPaidAmount: 0,
    unpaidInvoices: 0,
    unpaidAmount: 0,
    overdueInvoices: 0,
    overdueAmount: 0
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchValue, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    calculateReport();
  }, [filteredInvoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getInvoices({ limit: 1000 });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(invoice => invoice.type === typeFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(invoice => invoice.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(invoice => invoice.date <= dateTo);
    }

    setFilteredInvoices(filtered);
  };

  const calculateReport = () => {
    const report: InvoiceReport = {
      totalInvoices: filteredInvoices.length,
      totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidInvoices: filteredInvoices.filter(inv => inv.status === 'paid').length,
      paidAmount: filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
      partiallyPaidInvoices: filteredInvoices.filter(inv => inv.status === 'partially_paid').length,
      partiallyPaidAmount: filteredInvoices.filter(inv => inv.status === 'partially_paid').reduce((sum, inv) => sum + inv.totalAmount, 0),
      unpaidInvoices: filteredInvoices.filter(inv => inv.status === 'unpaid').length,
      unpaidAmount: filteredInvoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + inv.totalAmount, 0),
      overdueInvoices: filteredInvoices.filter(inv => inv.status === 'overdue').length,
      overdueAmount: filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.totalAmount, 0)
    };

    setReport(report);
  };

  const exportReport = () => {
    const csvContent = [
      ['تقرير الفواتير'],
      [`الفترة من: ${dateFrom || 'البداية'} إلى: ${dateTo || 'النهاية'}`],
      [''],
      ['إجمالي الفواتير', report.totalInvoices.toString()],
      ['إجمالي المبالغ', (isNaN(report.totalAmount) || !isFinite(report.totalAmount) ? 0 : report.totalAmount).toLocaleString('ar-LY')],
      [''],
      ['الفواتير المسددة بالكامل', report.paidInvoices.toString()],
      ['مبلغ الفواتير المسددة', (isNaN(report.paidAmount) || !isFinite(report.paidAmount) ? 0 : report.paidAmount).toLocaleString('ar-LY')],
      [''],
      ['الفواتير المسددة جزئياً', report.partiallyPaidInvoices.toString()],
      ['مبلغ الفواتير المسددة جزئياً', (isNaN(report.partiallyPaidAmount) || !isFinite(report.partiallyPaidAmount) ? 0 : report.partiallyPaidAmount).toLocaleString('ar-LY')],
      [''],
      ['الفواتير غير المسددة', report.unpaidInvoices.toString()],
      ['مبلغ الفواتير غير المسددة', (isNaN(report.unpaidAmount) || !isFinite(report.unpaidAmount) ? 0 : report.unpaidAmount).toLocaleString('ar-LY')],
      [''],
      ['الفواتير المتأخرة', report.overdueInvoices.toString()],
      ['مبلغ الفواتير المتأخرة', (isNaN(report.overdueAmount) || !isFinite(report.overdueAmount) ? 0 : report.overdueAmount).toLocaleString('ar-LY')],
      [''],
      ['رقم الفاتورة', 'العميل', 'التاريخ', 'تاريخ الاستحقاق', 'المبلغ', 'المسدد', 'المتبقي', 'الحالة'],
      ...filteredInvoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.customerName,
        new Date(invoice.date).toLocaleDateString('ar-LY'),
        new Date(invoice.dueDate).toLocaleDateString('ar-LY'),
        (isNaN(invoice.totalAmount) || !isFinite(invoice.totalAmount) ? 0 : invoice.totalAmount).toLocaleString('ar-LY'),
        (isNaN(invoice.paidAmount) || !isFinite(invoice.paidAmount) ? 0 : invoice.paidAmount).toLocaleString('ar-LY'),
        (isNaN(invoice.remainingAmount) || !isFinite(invoice.remainingAmount) ? 0 : invoice.remainingAmount).toLocaleString('ar-LY'),
        getStatusLabel(invoice.status)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      paid: 'مسدد بالكامل',
      partially_paid: 'مسدد جزئياً',
      unpaid: 'غير مسدد',
      overdue: 'متأخر'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      unpaid: 'bg-red-100 text-red-800',
      overdue: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partially_paid':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'unpaid':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'حالة السداد',
      value: statusFilter,
      options: [
        { value: '', label: 'جميع الحالات' },
        { value: 'paid', label: 'مسدد بالكامل' },
        { value: 'partially_paid', label: 'مسدد جزئياً' },
        { value: 'unpaid', label: 'غير مسدد' },
        { value: 'overdue', label: 'متأخر' }
      ],
      onChange: setStatusFilter
    },
    {
      key: 'type',
      label: 'نوع الفاتورة',
      value: typeFilter,
      options: [
        { value: '', label: 'جميع الأنواع' },
        { value: 'shipping', label: 'شحن' },
        { value: 'purchase', label: 'شراء' },
        { value: 'service', label: 'خدمة' }
      ],
      onChange: setTypeFilter
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">تقارير الفواتير</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">تقرير شامل عن حالة سداد الفواتير</p>
            </div>
            <button
              onClick={exportReport}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
            >
              <Download className="h-4 w-4 ml-2" />
              تصدير التقرير
            </button>
          </div>
        </div>

        {/* Report Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-gray-900">{report.totalInvoices}</p>
                <p className="text-sm text-gray-500">{(isNaN(report.totalAmount) || !isFinite(report.totalAmount) ? 0 : report.totalAmount).toLocaleString('ar-LY')} LYD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">مسدد بالكامل</p>
                <p className="text-2xl font-bold text-gray-900">{report.paidInvoices}</p>
                <p className="text-sm text-gray-500">{(isNaN(report.paidAmount) || !isFinite(report.paidAmount) ? 0 : report.paidAmount).toLocaleString('ar-LY')} LYD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">مسدد جزئياً</p>
                <p className="text-2xl font-bold text-gray-900">{report.partiallyPaidInvoices}</p>
                <p className="text-sm text-gray-500">{(isNaN(report.partiallyPaidAmount) || !isFinite(report.partiallyPaidAmount) ? 0 : report.partiallyPaidAmount).toLocaleString('ar-LY')} LYD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">غير مسدد</p>
                <p className="text-2xl font-bold text-gray-900">{report.unpaidInvoices}</p>
                <p className="text-sm text-gray-500">{(isNaN(report.unpaidAmount) || !isFinite(report.unpaidAmount) ? 0 : report.unpaidAmount).toLocaleString('ar-LY')} LYD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">متأخر</p>
                <p className="text-2xl font-bold text-gray-900">{report.overdueInvoices}</p>
                <p className="text-sm text-gray-500">{(isNaN(report.overdueAmount) || !isFinite(report.overdueAmount) ? 0 : report.overdueAmount).toLocaleString('ar-LY')} LYD</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          </div>

          <SearchFilter
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filterOptions}
            onClearFilters={() => {
              setSearchValue('');
              setStatusFilter('');
              setTypeFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            placeholder="البحث في الفواتير..."
          />
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">تفاصيل الفواتير</h2>
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
                      رقم الفاتورة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الاستحقاق
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ الإجمالي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ المسدد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ المتبقي
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        لا توجد فواتير
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.date).toLocaleDateString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.dueDate).toLocaleDateString('ar-LY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                          {(isNaN(invoice.totalAmount) || !isFinite(invoice.totalAmount) ? 0 : invoice.totalAmount).toLocaleString('ar-LY')} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-left">
                          {(isNaN(invoice.paidAmount) || !isFinite(invoice.paidAmount) ? 0 : invoice.paidAmount).toLocaleString('ar-LY')} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-left">
                          {(isNaN(invoice.remainingAmount) || !isFinite(invoice.remainingAmount) ? 0 : invoice.remainingAmount).toLocaleString('ar-LY')} LYD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            <span className="mr-1">{getStatusLabel(invoice.status)}</span>
                          </span>
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
    </div>
  );
};

export default InvoiceReports;
