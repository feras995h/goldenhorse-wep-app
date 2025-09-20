import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X
} from 'lucide-react';

interface FinancialData {
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  exchangeRate: number;
}

interface FinancialControlPanelProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  readOnly?: boolean;
  showExchangeRate?: boolean;
  allowNegativeValues?: boolean;
}

const FinancialControlPanel: React.FC<FinancialControlPanelProps> = ({
  data,
  onChange,
  readOnly = false,
  showExchangeRate = true,
  allowNegativeValues = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState<FinancialData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTempData(data);
  }, [data]);

  const validateValue = (field: string, value: number): string | null => {
    if (!allowNegativeValues && value < 0) {
      return 'لا يمكن أن تكون القيمة سالبة';
    }

    switch (field) {
      case 'discountPercent':
      case 'taxPercent':
        if (value < 0 || value > 100) {
          return 'يجب أن تكون النسبة بين 0 و 100';
        }
        break;
      case 'exchangeRate':
        if (value <= 0) {
          return 'يجب أن يكون سعر الصرف أكبر من صفر';
        }
        break;
      case 'paidAmount':
        if (value > tempData.total) {
          return 'المبلغ المدفوع لا يمكن أن يكون أكبر من المجموع';
        }
        break;
    }

    return null;
  };

  const calculateTotals = (newData: Partial<FinancialData>): FinancialData => {
    const updated = { ...tempData, ...newData };

    // Calculate discount amount from percentage
    if ('discountPercent' in newData) {
      updated.discountAmount = updated.subtotal * (updated.discountPercent / 100);
    }

    // Calculate tax amount from percentage
    if ('taxPercent' in newData) {
      const afterDiscount = updated.subtotal - updated.discountAmount;
      updated.taxAmount = afterDiscount * (updated.taxPercent / 100);
    }

    // Calculate total
    updated.total = updated.subtotal - updated.discountAmount + updated.taxAmount;

    // Calculate outstanding amount
    updated.outstandingAmount = updated.total - updated.paidAmount;

    return updated;
  };

  const handleFieldChange = (field: keyof FinancialData, value: number) => {
    const error = validateValue(field, value);
    
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    if (!error) {
      const newData = calculateTotals({ [field]: value });
      setTempData(newData);
    }
  };

  const handleSave = () => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (!hasErrors) {
      onChange(tempData);
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setTempData(data);
    setErrors({});
    setEditMode(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
    return `${safeAmount.toLocaleString('ar-LY')} ${currency}`;
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'LYD': return 'د.ل';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'CNY': return '¥';
      default: return currency;
    }
  };

  const FieldDisplay: React.FC<{
    label: string;
    value: number;
    field: keyof FinancialData;
    type?: 'currency' | 'percentage' | 'number';
    icon?: React.ReactNode;
    color?: string;
  }> = ({ label, value, field, type = 'currency', icon, color = 'text-gray-900' }) => {
    const isEditing = editMode && !readOnly;
    const error = errors[field];

    const formatValue = () => {
      switch (type) {
        case 'percentage':
          return `${value}%`;
        case 'currency':
          return formatCurrency(value, tempData.currency);
        default:
          return value.toString();
      }
    };

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-left">
          {isEditing ? (
            <div>
              <input
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(field, Number(e.target.value))}
                className={`w-24 px-2 py-1 text-sm border rounded ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                step={type === 'percentage' ? '0.01' : '0.01'}
                min={allowNegativeValues ? undefined : '0'}
                max={type === 'percentage' ? '100' : undefined}
              />
              {error && (
                <div className="text-xs text-red-600 mt-1">{error}</div>
              )}
            </div>
          ) : (
            <span className={`font-medium ${color}`}>
              {formatValue()}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Calculator size={20} />
          التحكم في القيم المالية
        </h3>
        
        {!readOnly && (
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-1"
                >
                  <Save size={16} />
                  حفظ
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 flex items-center gap-1"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <Edit size={16} />
                تعديل
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Basic Amounts */}
        <div className="space-y-3 mb-6">
          <FieldDisplay
            label="المجموع الفرعي"
            value={tempData.subtotal}
            field="subtotal"
            icon={<DollarSign size={16} className="text-blue-600" />}
          />

          <FieldDisplay
            label="نسبة الخصم"
            value={tempData.discountPercent}
            field="discountPercent"
            type="percentage"
            icon={<TrendingDown size={16} className="text-red-600" />}
          />

          <FieldDisplay
            label="مبلغ الخصم"
            value={tempData.discountAmount}
            field="discountAmount"
            icon={<TrendingDown size={16} className="text-red-600" />}
            color="text-red-600"
          />

          <FieldDisplay
            label="نسبة الضريبة"
            value={tempData.taxPercent}
            field="taxPercent"
            type="percentage"
            icon={<TrendingUp size={16} className="text-green-600" />}
          />

          <FieldDisplay
            label="مبلغ الضريبة"
            value={tempData.taxAmount}
            field="taxAmount"
            icon={<TrendingUp size={16} className="text-green-600" />}
            color="text-green-600"
          />
        </div>

        {/* Total Section */}
        <div className="border-t pt-4 mb-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">المجموع النهائي</span>
            </div>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(tempData.total, tempData.currency)}
            </span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-3 mb-6">
          <FieldDisplay
            label="المبلغ المدفوع"
            value={tempData.paidAmount}
            field="paidAmount"
            icon={<CreditCard size={16} className="text-green-600" />}
            color="text-green-600"
          />

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet size={16} className={tempData.outstandingAmount > 0 ? "text-red-600" : "text-green-600"} />
              <span className="text-sm font-medium text-gray-700">المبلغ المستحق</span>
            </div>
            <div className="text-left">
              <span className={`font-bold ${tempData.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(tempData.outstandingAmount, tempData.currency)}
              </span>
              {tempData.outstandingAmount > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertTriangle size={12} />
                  مبلغ مستحق
                </div>
              )}
              {tempData.outstandingAmount === 0 && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle size={12} />
                  مدفوع بالكامل
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exchange Rate */}
        {showExchangeRate && (
          <div className="border-t pt-4">
            <FieldDisplay
              label="سعر الصرف"
              value={tempData.exchangeRate}
              field="exchangeRate"
              type="number"
              icon={<TrendingUp size={16} className="text-purple-600" />}
            />
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              1 {tempData.currency} = {tempData.exchangeRate} دينار ليبي
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-green-600 font-medium">نسبة الدفع</div>
            <div className="text-lg font-bold text-green-700">
              {tempData.total > 0 ? Math.round((tempData.paidAmount / tempData.total) * 100) : 0}%
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-medium">العملة</div>
            <div className="text-lg font-bold text-blue-700">
              {getCurrencySymbol(tempData.currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialControlPanel;
