import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, Building } from 'lucide-react';

interface FixedAssetFormProps {
  formData: {
    assetNumber: string;
    name: string;
    nameEn?: string;
    category: string;
    branch: string;
    purchaseDate: string;
    purchasePrice: number;
    currency: string;
    depreciationMethod: 'straight_line' | 'declining_balance';
    usefulLife: number;
    salvageValue: number;
    location?: string;
    serialNumber?: string;
    supplier?: string;
    warrantyExpiry?: string;
    notes?: string;
  };
  onFormDataChange: (data: any) => void;
  errors: Record<string, string>;
}

const FixedAssetForm: React.FC<FixedAssetFormProps> = ({
  formData,
  onFormDataChange,
  errors
}) => {
  // Calculate derived values
  const bookValue = formData.purchasePrice - formData.salvageValue;
  const annualDepreciation = formData.depreciationMethod === 'straight_line' 
    ? bookValue / formData.usefulLife 
    : (bookValue * 2) / formData.usefulLife; // Double declining balance
  const monthlyDepreciation = annualDepreciation / 12;

  // Calculate accumulated depreciation (simplified - in real app this would be from database)
  const monthsSincePurchase = Math.max(0, 
    Math.floor((new Date().getTime() - new Date(formData.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  const accumulatedDepreciation = Math.min(
    monthsSincePurchase * monthlyDepreciation,
    bookValue
  );
  const currentBookValue = formData.purchasePrice - accumulatedDepreciation;

  const updateField = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const calculateDepreciation = () => {
    // This would trigger a recalculation of depreciation
    console.log('Calculating depreciation...');
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الأصل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.assetNumber}
              onChange={(e) => updateField('assetNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.assetNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="أدخل رقم الأصل"
            />
            {errors.assetNumber && <p className="text-red-500 text-sm mt-1">{errors.assetNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم الأصل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="أدخل اسم الأصل"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم بالإنجليزية
            </label>
            <input
              type="text"
              value={formData.nameEn || ''}
              onChange={(e) => updateField('nameEn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              placeholder="Asset name in English"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الفئة <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">اختر الفئة</option>
              <option value="buildings">مباني</option>
              <option value="machinery">آلات ومعدات</option>
              <option value="vehicles">مركبات</option>
              <option value="furniture">أثاث ومفروشات</option>
              <option value="computers">أجهزة حاسوب</option>
              <option value="land">أراضي</option>
              <option value="other">أخرى</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الفرع <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => updateField('branch', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.branch ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="أدخل الفرع"
            />
            {errors.branch && <p className="text-red-500 text-sm mt-1">{errors.branch}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ الشراء <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.purchaseDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.purchaseDate && <p className="text-red-500 text-sm mt-1">{errors.purchaseDate}</p>}
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات المالية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              التكلفة <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) => updateField('purchasePrice', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.purchasePrice && <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الخردة
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.salvageValue}
              onChange={(e) => updateField('salvageValue', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              العملة
            </label>
            <select
              value={formData.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
            >
              <option value="LYD">دينار ليبي</option>
              <option value="USD">دولار أمريكي</option>
              <option value="EUR">يورو</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              العمر الإنتاجي (سنوات) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.usefulLife}
              onChange={(e) => updateField('usefulLife', parseInt(e.target.value) || 1)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-golden-500 focus:border-golden-500 ${
                errors.usefulLife ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.usefulLife && <p className="text-red-500 text-sm mt-1">{errors.usefulLife}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              طريقة الإهلاك
            </label>
            <select
              value={formData.depreciationMethod}
              onChange={(e) => updateField('depreciationMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
            >
              <option value="straight_line">القسط الثابت</option>
              <option value="declining_balance">القسط المتناقص</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={calculateDepreciation}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-golden-600 hover:bg-golden-700"
            >
              <Calculator className="h-4 w-4 ml-2" />
              حساب الإهلاك
            </button>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات إضافية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الموقع
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              placeholder="موقع الأصل"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الرقم التسلسلي
            </label>
            <input
              type="text"
              value={formData.serialNumber || ''}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              placeholder="الرقم التسلسلي"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المورد
            </label>
            <input
              type="text"
              value={formData.supplier || ''}
              onChange={(e) => updateField('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              placeholder="اسم المورد"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ انتهاء الضمان
            </label>
            <input
              type="date"
              value={formData.warrantyExpiry || ''}
              onChange={(e) => updateField('warrantyExpiry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-golden-500 focus:border-golden-500"
              placeholder="ملاحظات إضافية..."
            />
          </div>
        </div>
      </div>

      {/* Calculations Summary */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ملخص الحسابات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-md">
            <div className="text-sm text-gray-600">القيمة القابلة للإهلاك</div>
            <div className="text-lg font-bold text-blue-600">
              {(isNaN(bookValue) || !isFinite(bookValue) ? 0 : bookValue).toLocaleString('ar-LY')} {formData.currency}
            </div>
            <div className="text-xs text-gray-500">
              التكلفة - الخردة
            </div>
          </div>

          <div className="bg-white p-3 rounded-md">
            <div className="text-sm text-gray-600">الإهلاك السنوي</div>
            <div className="text-lg font-bold text-green-600">
              {(isNaN(annualDepreciation) || !isFinite(annualDepreciation) ? 0 : annualDepreciation).toLocaleString('ar-LY')} {formData.currency}
            </div>
            <div className="text-xs text-gray-500">
              {formData.depreciationMethod === 'straight_line' ? 'قسط ثابت' : 'قسط متناقص'}
            </div>
          </div>

          <div className="bg-white p-3 rounded-md">
            <div className="text-sm text-gray-600">مجمع الإهلاك</div>
            <div className="text-lg font-bold text-orange-600">
              {(isNaN(accumulatedDepreciation) || !isFinite(accumulatedDepreciation) ? 0 : accumulatedDepreciation).toLocaleString('ar-LY')} {formData.currency}
            </div>
            <div className="text-xs text-gray-500">
              حتى تاريخ اليوم
            </div>
          </div>

          <div className="bg-white p-3 rounded-md">
            <div className="text-sm text-gray-600">القيمة الدفترية</div>
            <div className="text-lg font-bold text-purple-600">
              {(isNaN(currentBookValue) || !isFinite(currentBookValue) ? 0 : currentBookValue).toLocaleString('ar-LY')} {formData.currency}
            </div>
            <div className="text-xs text-gray-500">
              التكلفة - مجمع الإهلاك
            </div>
          </div>
        </div>

        {/* Validation */}
        {formData.purchasePrice > 0 && formData.salvageValue >= formData.purchasePrice && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
              <div className="text-sm text-red-700">
                <p className="font-medium">قيمة الخردة غير صحيحة</p>
                <p>يجب أن تكون قيمة الخردة أقل من التكلفة</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedAssetForm;



