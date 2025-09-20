import React, { useState, useEffect } from 'react';
import { Building, Upload, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { financialAPI } from '../../../services/api';

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
  bankAccount?: string;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
}

interface CompanySettingsManagerProps {
  onSave?: (companyInfo: CompanyInfo) => void;
  initialData?: CompanyInfo;
}

const CompanySettingsManager: React.FC<CompanySettingsManagerProps> = ({
  onSave,
  initialData
}) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'منضومة وائل للخدمات البحرية',
    nameEn: 'Wael Maritime Services System',
    address: 'طرابلس، ليبيا',
    phone: '+218-21-1234567',
    email: 'info@waelmaritimeservices.ly',
    website: 'www.waelmaritimeservices.ly',
    taxNumber: '123456789',
    commercialRegister: 'CR-2024-001',
    bankAccount: '1234567890',
    bankName: 'مصرف الجمهورية',
    iban: 'LY83002001000000001234567890',
    swiftCode: 'CBLYLYTR',
    ...initialData
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(companyInfo.logo || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: 'يرجى اختيار ملف صورة صالح'
        }));
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'حجم الملف يجب أن يكون أقل من 2 ميجابايت'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setCompanyInfo(prev => ({
          ...prev,
          logo: result
        }));
        setErrors(prev => ({
          ...prev,
          logo: ''
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!companyInfo.name.trim()) {
      newErrors.name = 'اسم الشركة مطلوب';
    }

    if (!companyInfo.address.trim()) {
      newErrors.address = 'عنوان الشركة مطلوب';
    }

    if (!companyInfo.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    }

    if (!companyInfo.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyInfo.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // In a real application, this would save to the backend
      // await financialAPI.updateCompanySettings(companyInfo);
      
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSave) {
        onSave(companyInfo);
      }
      
      // Show success message
      alert('تم حفظ إعدادات الشركة بنجاح');
    } catch (error) {
      console.error('Error saving company settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      setCompanyInfo({
        name: 'منضومة وائل للخدمات البحرية',
        nameEn: 'Wael Maritime Services System',
        address: 'طرابلس، ليبيا',
        phone: '+218-21-1234567',
        email: 'info@waelmaritimeservices.ly',
        website: 'www.waelmaritimeservices.ly',
        taxNumber: '123456789',
        commercialRegister: 'CR-2024-001',
        bankAccount: '1234567890',
        bankName: 'مصرف الجمهورية',
        iban: 'LY83002001000000001234567890',
        swiftCode: 'CBLYLYTR'
      });
      setLogoPreview(null);
      setErrors({});
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building className="h-6 w-6 text-blue-600 ml-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">إعدادات الشركة</h2>
              <p className="text-sm text-gray-600">إدارة معلومات الشركة للمطبوعات والفواتير</p>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4 ml-2" /> : <Eye className="h-4 w-4 ml-2" />}
            {showPreview ? 'إخفاء المعاينة' : 'عرض المعاينة'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الشركة (عربي) *
                </label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="اسم الشركة"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الشركة (إنجليزي)
                </label>
                <input
                  type="text"
                  value={companyInfo.nameEn}
                  onChange={(e) => handleInputChange('nameEn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Company Name in English"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان *
                </label>
                <textarea
                  value={companyInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="عنوان الشركة"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    value={companyInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+218-21-1234567"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="info@company.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع الإلكتروني
                </label>
                <input
                  type="url"
                  value={companyInfo.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="www.company.com"
                />
              </div>
            </div>
          </div>

          {/* Legal Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات القانونية</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم الضريبي
                  </label>
                  <input
                    type="text"
                    value={companyInfo.taxNumber || ''}
                    onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السجل التجاري
                  </label>
                  <input
                    type="text"
                    value={companyInfo.commercialRegister || ''}
                    onChange={(e) => handleInputChange('commercialRegister', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CR-2024-001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات المصرفية</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المصرف
                  </label>
                  <input
                    type="text"
                    value={companyInfo.bankName || ''}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="مصرف الجمهورية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الحساب
                  </label>
                  <input
                    type="text"
                    value={companyInfo.bankAccount || ''}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم IBAN
                  </label>
                  <input
                    type="text"
                    value={companyInfo.iban || ''}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="LY83002001000000001234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رمز SWIFT
                  </label>
                  <input
                    type="text"
                    value={companyInfo.swiftCode || ''}
                    onChange={(e) => handleInputChange('swiftCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="CBLYLYTR"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">شعار الشركة</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رفع الشعار
                </label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    اختيار ملف
                  </label>
                  <span className="text-sm text-gray-500">
                    PNG, JPG, GIF حتى 2MB
                  </span>
                </div>
                {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
              </div>

              {logoPreview && (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-16 w-16 object-contain border border-gray-300 rounded-lg"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">معاينة الشعار</p>
                    <button
                      onClick={() => {
                        setLogoPreview(null);
                        setCompanyInfo(prev => ({ ...prev, logo: undefined }));
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      حذف الشعار
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4 ml-2" />
                إعادة تعيين
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة المعلومات</h3>
            
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Header Preview */}
              <div className="flex items-start space-x-4 space-x-reverse">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="h-16 w-16 object-contain"
                  />
                )}
                <div>
                  <h4 className="text-xl font-bold text-blue-900">{companyInfo.name}</h4>
                  {companyInfo.nameEn && (
                    <h5 className="text-lg text-blue-700">{companyInfo.nameEn}</h5>
                  )}
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <p>{companyInfo.address}</p>
                    <p>هاتف: {companyInfo.phone} | بريد إلكتروني: {companyInfo.email}</p>
                    {companyInfo.website && <p>الموقع: {companyInfo.website}</p>}
                    {companyInfo.taxNumber && <p>الرقم الضريبي: {companyInfo.taxNumber}</p>}
                    {companyInfo.commercialRegister && <p>السجل التجاري: {companyInfo.commercialRegister}</p>}
                  </div>
                </div>
              </div>

              {/* Banking Info Preview */}
              {(companyInfo.bankName || companyInfo.bankAccount) && (
                <div className="border-t pt-4">
                  <h6 className="font-medium text-gray-900 mb-2">المعلومات المصرفية:</h6>
                  <div className="text-sm text-gray-600 space-y-1">
                    {companyInfo.bankName && <p>المصرف: {companyInfo.bankName}</p>}
                    {companyInfo.bankAccount && <p>رقم الحساب: {companyInfo.bankAccount}</p>}
                    {companyInfo.iban && <p>IBAN: {companyInfo.iban}</p>}
                    {companyInfo.swiftCode && <p>SWIFT: {companyInfo.swiftCode}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsManager;
