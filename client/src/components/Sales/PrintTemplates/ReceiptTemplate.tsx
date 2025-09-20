import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface Customer {
  id: string;
  code: string;
  name: string;
  customerType: 'local' | 'foreign';
  nationality?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface Receipt {
  id: string;
  receiptNo: string;
  receiptDate: string;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other';
  referenceNo?: string;
  bankAccount?: string;
  checkNumber?: string;
  remarks?: string;
  customer?: Customer;
  partyType: 'customer' | 'supplier' | 'employee' | 'account';
  voucherType: 'receipt' | 'payment';
  status: 'pending' | 'completed' | 'cancelled';
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

interface ReceiptTemplateProps {
  receipt: Receipt;
  companyInfo: CompanyInfo;
  showHeader?: boolean;
  showFooter?: boolean;
  template?: 'standard' | 'minimal' | 'detailed';
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  receipt,
  companyInfo,
  showHeader = true,
  showFooter = true,
  template = 'standard'
}) => {
  const getVoucherTypeLabel = (type: string) => {
    return type === 'receipt' ? 'إيصال قبض' : 'إيصال صرف';
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'check': return 'شيك';
      case 'credit_card': return 'بطاقة ائتمان';
      case 'other': return 'أخرى';
      default: return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'pending': return 'معلق';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVoucherColor = (type: string) => {
    return type === 'receipt' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
      {/* Header */}
      {showHeader && (
        <div className="border-b-2 border-gray-300 pb-6 mb-6">
          <div className="text-center mb-4">
            {companyInfo.logo && (
              <img 
                src={companyInfo.logo} 
                alt="Company Logo" 
                className="h-16 w-16 mx-auto mb-3 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {companyInfo.name}
            </h1>
            <h2 className="text-lg text-gray-700 mb-2">
              {companyInfo.nameEn}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{companyInfo.address}</p>
              <p>هاتف: {companyInfo.phone} | بريد إلكتروني: {companyInfo.email}</p>
              {companyInfo.taxNumber && <p>الرقم الضريبي: {companyInfo.taxNumber}</p>}
            </div>
          </div>

          {/* Voucher Type Header */}
          <div className="text-center">
            <div className={`inline-block px-6 py-3 rounded-lg ${getVoucherColor(receipt.voucherType)}`}>
              <h3 className="text-xl font-bold">
                {getVoucherTypeLabel(receipt.voucherType)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Information */}
      <div className="mb-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">رقم الإيصال:</span>
                <span className="font-bold text-lg text-blue-600">{receipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">التاريخ:</span>
                <span className="font-medium">{formatDate(receipt.receiptDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">طريقة الدفع:</span>
                <span className="font-medium">{getPaymentMethodLabel(receipt.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">الحالة:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(receipt.status)}`}>
                  {getStatusLabel(receipt.status)}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {receipt.referenceNo && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">رقم المرجع:</span>
                  <span className="font-medium">{receipt.referenceNo}</span>
                </div>
              )}
              {receipt.bankAccount && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">الحساب البنكي:</span>
                  <span className="font-medium">{receipt.bankAccount}</span>
                </div>
              )}
              {receipt.checkNumber && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">رقم الشيك:</span>
                  <span className="font-medium">{receipt.checkNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">العملة:</span>
                <span className="font-medium">{receipt.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer/Party Information */}
      {receipt.customer && (
        <div className="mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-bold text-gray-900 mb-4">
              {receipt.voucherType === 'receipt' ? 'بيانات العميل' : 'بيانات المستفيد'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">الاسم:</span>
                  <span className="font-bold">{receipt.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">الكود:</span>
                  <span>{receipt.customer.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">النوع:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    receipt.customer.customerType === 'foreign' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-green-600 bg-green-50'
                  }`}>
                    {receipt.customer.customerType === 'foreign' ? 'أجنبي' : 'محلي'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {receipt.customer.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">الهاتف:</span>
                    <span>{receipt.customer.phone}</span>
                  </div>
                )}
                {receipt.customer.email && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">البريد الإلكتروني:</span>
                    <span>{receipt.customer.email}</span>
                  </div>
                )}
                {receipt.customer.nationality && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">الجنسية:</span>
                    <span>{receipt.customer.nationality}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amount Section */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              {receipt.voucherType === 'receipt' ? 'المبلغ المستلم' : 'المبلغ المدفوع'}
            </h4>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {formatCurrency(receipt.amount, receipt.currency)}
            </div>
            <div className="text-sm text-gray-600">
              ({receipt.currency})
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {receipt.remarks && (
        <div className="mb-6">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-bold text-gray-900 mb-2">ملاحظات:</h5>
            <p className="text-sm text-gray-700">{receipt.remarks}</p>
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-2 mt-12">
              <p className="text-sm font-medium text-gray-700">توقيع المستلم</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-2 mt-12">
              <p className="text-sm font-medium text-gray-700">توقيع المسؤول</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="border-t pt-6 mt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              {receipt.voucherType === 'receipt' 
                ? 'شكراً لتعاملكم معنا' 
                : 'تم الدفع بنجاح'
              }
            </p>
            <p>تم إنشاء هذا الإيصال إلكترونياً في {formatDate(new Date().toISOString())}</p>
            <div className="mt-4 text-xs text-gray-500">
              <p>هذا الإيصال صالح ومعتمد إلكترونياً</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptTemplate;
