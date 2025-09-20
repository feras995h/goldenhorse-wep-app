import React, { useState, useEffect } from 'react';
import { Upload, Image, Trash2, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { settingsAPI } from '../services/api';
import { useLogo } from '../contexts/LogoContext';

interface LogoSettings {
  filename: string | null;
  originalName: string | null;
  uploadDate: string | null;
  size: number | null;
  mimetype: string | null;
}

interface SystemSettingsData {
  logo: LogoSettings;
  lastUpdated: string;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { refreshLogo } = useLogo();

  useEffect(() => {
    // Only load settings if we're in the browser
    if (typeof window !== 'undefined') {
      loadSettings();
    }
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsAPI.getSettings();
      setSettings(data);

      // Set preview URL if logo exists
      if (data && data.logo && data.logo.filename) {
        setPreviewUrl(settingsAPI.getLogoUrl() + '?t=' + Date.now());
      } else {
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'فشل في تحميل الإعدادات' });
      // Set default settings on error
      setSettings({
        logo: {
          filename: null,
          originalName: null,
          uploadDate: null,
          size: null,
          mimetype: null
        },
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'نوع الملف غير مدعوم. يرجى اختيار ملف PNG أو JPG أو SVG' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setMessage(null);
      
      await settingsAPI.uploadLogo(selectedFile);
      
      // Reload settings to get updated data
      await loadSettings();

      // Refresh logo across the app
      refreshLogo();

      // Notify login page about logo update
      window.dispatchEvent(new CustomEvent('logoUpdated'));

      setSelectedFile(null);
      setMessage({ type: 'success', text: 'تم رفع الشعار بنجاح!' });

      // Clear the file input
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      const errorMessage = error.response?.data?.message || 'فشل في رفع الشعار';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!settings?.logo.filename) return;
    
    if (!confirm('هل أنت متأكد من حذف الشعار الحالي؟')) return;

    try {
      setUploading(true);
      await settingsAPI.deleteLogo();
      
      // Reload settings
      await loadSettings();

      // Refresh logo across the app
      refreshLogo();

      // Notify login page about logo update
      window.dispatchEvent(new CustomEvent('logoUpdated'));

      setPreviewUrl(null);
      setSelectedFile(null);

      setMessage({ type: 'success', text: 'تم حذف الشعار بنجاح!' });
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      const errorMessage = error.response?.data?.message || 'فشل في حذف الشعار';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>

        <div className="relative z-10 flex items-center slide-in-right">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg golden-glow ml-4">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">إعدادات النظام</h1>
            <p className="text-gray-300 text-lg">إدارة إعدادات التطبيق والشعار</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 space-x-reverse ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Logo Management Section */}
      <div className="card-gradient">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Image className="h-6 w-6 ml-3 text-golden-600" />
            إدارة شعار الموقع
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Current Logo Display */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">الشعار الحالي</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Logo Preview" 
                      className="max-w-full max-h-32 mx-auto object-contain"
                      onError={() => setPreviewUrl(null)}
                    />
                    {settings?.logo.filename && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>اسم الملف:</strong> {settings.logo.originalName}</p>
                        <p><strong>الحجم:</strong> {settings.logo.size ? formatFileSize(settings.logo.size) : 'غير محدد'}</p>
                        <p><strong>تاريخ الرفع:</strong> {settings.logo.uploadDate ? formatDate(settings.logo.uploadDate) : 'غير محدد'}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Image className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>لا يوجد شعار مرفوع</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload New Logo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">رفع شعار جديد</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    اختر ملف الشعار
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-golden-50 file:text-golden-700 hover:file:bg-golden-100"
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    الأنواع المدعومة: PNG, JPG, SVG (الحد الأقصى: 5 ميجابايت)
                  </p>
                </div>

                <div className="flex space-x-3 space-x-reverse">
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {uploading ? 'جاري الرفع...' : 'رفع الشعار'}
                    </span>
                  </button>

                  {settings?.logo.filename && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={uploading}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm font-medium">حذف الشعار</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
