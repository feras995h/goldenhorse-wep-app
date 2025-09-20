import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

interface Customer {
  id: string;
  code: string;
  name: string;
  customerType: 'local' | 'foreign';
  nationality?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount: number;
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
  commercialRegister?: string;
}

interface InvoiceTemplateProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
  showHeader?: boolean;
  showFooter?: boolean;
  template?: 'standard' | 'detailed' | 'minimal';
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  companyInfo,
  showHeader = true,
  showFooter = true,
  template = 'standard'
}) => {
  const getCustomerTypeLabel = (type: string) => {
    return type === 'foreign' ? 'عميل أجنبي' : 'عميل محلي';
  };

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

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
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
                  {companyInfo.commercialRegister && <p>السجل التجاري: {companyInfo.commercialRegister}</p>}
                </div>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-3">فاتورة مبيعات</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">رقم الفاتورة:</span>
                    <span className="font-bold text-blue-600">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">التاريخ:</span>
                    <span>{formatDate(invoice.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">تاريخ الاستحقاق:</span>
                    <span>{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">حالة الدفع:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {getPaymentStatusLabel(invoice.paymentStatus)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-bold text-gray-900 mb-3">بيانات العميل</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">اسم العميل:</span>
                <span className="font-bold">{invoice.customer.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">كود العميل:</span>
                <span>{invoice.customer.code}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">نوع العميل:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  invoice.customer.customerType === 'foreign' 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-green-600 bg-green-50'
                }`}>
                  {getCustomerTypeLabel(invoice.customer.customerType)}
                </span>
              </div>
              {invoice.customer.nationality && (
                <div className="flex justify-between mb-2">
                  <span className="font-medium">الجنسية:</span>
                  <span>{invoice.customer.nationality}</span>
                </div>
              )}
            </div>
            <div>
              {invoice.customer.address && (
                <div className="flex justify-between mb-2">
                  <span className="font-medium">العنوان:</span>
                  <span>{invoice.customer.address}</span>
                </div>
              )}
              {invoice.customer.phone && (
                <div className="flex justify-between mb-2">
                  <span className="font-medium">الهاتف:</span>
                  <span>{invoice.customer.phone}</span>
                </div>
              )}
              {invoice.customer.email && (
                <div className="flex justify-between mb-2">
                  <span className="font-medium">البريد الإلكتروني:</span>
                  <span>{invoice.customer.email}</span>
                </div>
              )}
              {invoice.customer.taxNumber && (
                <div className="flex justify-between mb-2">
                  <span className="font-medium">الرقم الضريبي:</span>
                  <span>{invoice.customer.taxNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-gray-300 px-4 py-3 text-right">#</th>
                <th className="border border-gray-300 px-4 py-3 text-right">الوصف</th>
                <th className="border border-gray-300 px-4 py-3 text-center">الوحدة</th>
                <th className="border border-gray-300 px-4 py-3 text-center">الكمية</th>
                <th className="border border-gray-300 px-4 py-3 text-center">سعر الوحدة</th>
                <th className="border border-gray-300 px-4 py-3 text-center">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.description}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {item.unit || 'قطعة'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {(isNaN(item.quantity) || !isFinite(item.quantity) ? 0 : item.quantity).toLocaleString('ar-LY')}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                    {formatCurrency(item.totalPrice, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-6">
        <div className="flex justify-end">
          <div className="w-full max-w-md">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span>المجموع الفرعي:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              
              {invoice.discountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>الخصم ({invoice.discountPercent}%):</span>
                  <span className="font-medium">-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                </div>
              )}
              
              {invoice.taxPercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span>الضريبة ({invoice.taxPercent}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold text-blue-900">
                  <span>المجموع الكلي:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
              
              {invoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-medium">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>المبلغ المتبقي:</span>
                    <span className="font-bold">{formatCurrency(invoice.total - invoice.paidAmount, invoice.currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="mb-6 space-y-4">
          {invoice.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h5 className="font-bold text-gray-900 mb-2">ملاحظات:</h5>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
          
          {invoice.terms && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-bold text-gray-900 mb-2">الشروط والأحكام:</h5>
              <p className="text-sm text-gray-700">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {showFooter && (
        <div className="border-t pt-6 mt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">شكراً لتعاملكم معنا</p>
            <p>تم إنشاء هذه الفاتورة إلكترونياً في {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplate;
