import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface SalesReportItem {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerType: 'local' | 'foreign';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  currency: string;
}

interface SalesReportSummary {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  localCustomersAmount: number;
  foreignCustomersAmount: number;
  averageInvoiceAmount: number;
  currency: string;
}

interface CompanyInfo {
  name: string;
  nameEn: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxNumber?: string;
}

interface SalesReportTemplateProps {
  reportData: SalesReportItem[];
  summary: SalesReportSummary;
  companyInfo: CompanyInfo;
  reportTitle: string;
  dateFrom: string;
  dateTo: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSummary?: boolean;
  template?: 'standard' | 'detailed' | 'summary';
}

const SalesReportTemplate: React.FC<SalesReportTemplateProps> = ({
  reportData,
  summary,
  companyInfo,
  reportTitle,
  dateFrom,
  dateTo,
  showHeader = true,
  showFooter = true,
  showSummary = true,
  template = 'standard'
}) => {
  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'partial': return 'مدفوعة جزئياً';
      case 'unpaid': return 'غير مدفوعة';
      default: return 'غير محدد';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50';
      case 'unpaid': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    return type === 'foreign' ? 'أجنبي' : 'محلي';
  };

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
      {/* Header */}
      {showHeader && (
        <div className="border-b-2 border-blue-600 pb-6 mb-6">
          <div className="flex justify-between items-start">
            {/* Company Info */}
            <div className="flex items-start space-x-4 space-x-reverse">
              {companyInfo.logo && (
                <img 
                  src={companyInfo.logo} 
                  alt="Company Logo" 
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-blue-900 mb-1">
                  {companyInfo.name}
                </h1>
                <h2 className="text-lg text-blue-700 mb-2">
                  {companyInfo.nameEn}
                </h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{companyInfo.address}</p>
                  <p>هاتف: {companyInfo.phone} | بريد إلكتروني: {companyInfo.email}</p>
                  {companyInfo.website && <p>الموقع: {companyInfo.website}</p>}
                  {companyInfo.taxNumber && <p>الرقم الضريبي: {companyInfo.taxNumber}</p>}
                </div>
              </div>
            </div>

            {/* Report Info */}
            <div className="text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-3">{reportTitle}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">من تاريخ:</span>
                    <span>{formatDate(dateFrom)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">إلى تاريخ:</span>
                    <span>{formatDate(dateTo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">تاريخ التقرير:</span>
                    <span>{formatDate(new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      {showSummary && (
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4">ملخص التقرير</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalInvoices}</div>
                <div className="text-sm text-gray-600">إجمالي الفواتير</div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalAmount, summary.currency)}
                </div>
                <div className="text-sm text-gray-600">إجمالي المبيعات</div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.totalPaid, summary.currency)}
                </div>
                <div className="text-sm text-gray-600">المبلغ المحصل</div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalOutstanding, summary.currency)}
                </div>
                <div className="text-sm text-gray-600">المبلغ المتبقي</div>
              </div>
            </div>
          </div>

          {/* Additional Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(summary.localCustomersAmount, summary.currency)}
                </div>
                <div className="text-sm text-gray-600">مبيعات العملاء المحليين</div>
              </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {formatCurrency(summary.foreignCustomersAmount, summary.currency)}
                </div>
                <div className="text-sm text-gray-600">مبيعات العملاء الأجانب</div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {formatCurrency(summary.averageInvoiceAmount, summary.currency)}
                </div>
                <div className="text-sm text-gray-600">متوسط قيمة الفاتورة</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="mb-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">تفاصيل المبيعات</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-gray-300 px-3 py-2 text-right">#</th>
                <th className="border border-gray-300 px-3 py-2 text-right">رقم الفاتورة</th>
                <th className="border border-gray-300 px-3 py-2 text-center">التاريخ</th>
                <th className="border border-gray-300 px-3 py-2 text-right">العميل</th>
                <th className="border border-gray-300 px-3 py-2 text-center">النوع</th>
                <th className="border border-gray-300 px-3 py-2 text-center">المجموع الفرعي</th>
                <th className="border border-gray-300 px-3 py-2 text-center">الخصم</th>
                <th className="border border-gray-300 px-3 py-2 text-center">الضريبة</th>
                <th className="border border-gray-300 px-3 py-2 text-center">الإجمالي</th>
                <th className="border border-gray-300 px-3 py-2 text-center">المدفوع</th>
                <th className="border border-gray-300 px-3 py-2 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-blue-600">
                    {item.invoiceNumber}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {formatDate(item.date)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {item.customerName}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.customerType === 'foreign' 
                        ? 'text-purple-600 bg-purple-50' 
                        : 'text-green-600 bg-green-50'
                    }`}>
                      {getCustomerTypeLabel(item.customerType)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {formatCurrency(item.subtotal, item.currency)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-green-600">
                    {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount, item.currency)}` : '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {item.taxAmount > 0 ? formatCurrency(item.taxAmount, item.currency) : '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                    {formatCurrency(item.total, item.currency)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-green-600">
                    {formatCurrency(item.paidAmount, item.currency)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(item.paymentStatus)}`}>
                      {getPaymentStatusLabel(item.paymentStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={5} className="border border-gray-300 px-3 py-2 text-center">
                  الإجمالي
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {formatCurrency(
                    reportData.reduce((sum, item) => sum + item.subtotal, 0),
                    summary.currency
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">
                  -{formatCurrency(
                    reportData.reduce((sum, item) => sum + item.discountAmount, 0),
                    summary.currency
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {formatCurrency(
                    reportData.reduce((sum, item) => sum + item.taxAmount, 0),
                    summary.currency
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-blue-600">
                  {formatCurrency(summary.totalAmount, summary.currency)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center text-green-600">
                  {formatCurrency(summary.totalPaid, summary.currency)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="border-t pt-6 mt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">تقرير المبيعات - {companyInfo.name}</p>
            <p>تم إنشاء هذا التقرير في {formatDate(new Date().toISOString())}</p>
            <div className="mt-4 text-xs text-gray-500">
              <p>هذا التقرير تم إنشاؤه إلكترونياً ولا يحتاج إلى توقيع</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReportTemplate;
