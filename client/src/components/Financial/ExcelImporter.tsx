import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { financialAPI } from '../../services/api';

interface ImportData {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

interface ExcelImporterProps {
  onImportComplete?: (data: ImportData[]) => void;
  onClose?: () => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImportComplete, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      setLoading(true);
      setErrors([]);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const processedData: ImportData[] = [];
      const validationErrors: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        if (!row || row.length === 0) continue;

        const accountCode = row[0]?.toString().trim();
        const accountName = row[1]?.toString().trim();
        const debit = parseFloat(row[2]?.toString() || '0');
        const credit = parseFloat(row[3]?.toString() || '0');
        const description = row[4]?.toString().trim() || '';

        // Validation
        if (!accountCode) {
          validationErrors.push(`الصف ${i + 1}: رقم الحساب مطلوب`);
          continue;
        }

        if (!accountName) {
          validationErrors.push(`الصف ${i + 1}: اسم الحساب مطلوب`);
          continue;
        }

        if (isNaN(debit) || isNaN(credit)) {
          validationErrors.push(`الصف ${i + 1}: المبالغ يجب أن تكون أرقام صحيحة`);
          continue;
        }

        if (debit < 0 || credit < 0) {
          validationErrors.push(`الصف ${i + 1}: المبالغ يجب أن تكون موجبة`);
          continue;
        }

        if (debit > 0 && credit > 0) {
          validationErrors.push(`الصف ${i + 1}: لا يمكن أن يكون للحساب مبلغ مدين ودائن في نفس الوقت`);
          continue;
        }

        if (debit === 0 && credit === 0) {
          validationErrors.push(`الصف ${i + 1}: يجب إدخال مبلغ مدين أو دائن`);
          continue;
        }

        processedData.push({
          accountCode,
          accountName,
          debit,
          credit,
          description
        });
      }

      setImportData(processedData);
      setErrors(validationErrors);
      
      if (validationErrors.length === 0 && processedData.length > 0) {
        setStep('preview');
      }

    } catch (error) {
      console.error('Error processing Excel file:', error);
      setErrors(['خطأ في قراءة ملف Excel. تأكد من صحة تنسيق الملف.']);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      
      // Process import data and create opening balance entries
      const importResults = [];
      
      for (const item of importData) {
        try {
          const result = await financialAPI.createOpeningBalanceEntry({
            accountCode: item.accountCode,
            accountName: item.accountName,
            debit: item.debit,
            credit: item.credit,
            description: item.description || 'مستورد من Excel',
            date: new Date().toISOString().split('T')[0]
          });
          
          importResults.push({ success: true, item, result });
        } catch (error: any) {
          importResults.push({ 
            success: false, 
            item, 
            error: error.response?.data?.message || error.message 
          });
        }
      }

      const successCount = importResults.filter(r => r.success).length;
      const errorCount = importResults.filter(r => !r.success).length;

      if (successCount > 0) {
        setStep('complete');
        onImportComplete?.(importData);
      }

      if (errorCount > 0) {
        const importErrors = importResults
          .filter(r => !r.success)
          .map(r => `${r.item.accountCode}: ${r.error}`);
        setErrors(importErrors);
      }

    } catch (error) {
      console.error('Error importing data:', error);
      setErrors(['خطأ في استيراد البيانات']);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['رقم الحساب', 'اسم الحساب', 'مدين', 'دائن', 'الوصف'],
      ['1.1', 'النقدية', '10000', '0', 'رصيد افتتاحي'],
      ['2.1', 'حسابات دائنة', '0', '5000', 'رصيد افتتاحي'],
      ['3.1', 'رأس المال', '0', '5000', 'رصيد افتتاحي']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الأرصدة الافتتاحية');
    XLSX.writeFile(wb, 'قالب_الأرصدة_الافتتاحية.xlsx');
  };

  const resetImporter = () => {
    setFile(null);
    setImportData([]);
    setErrors([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalDebit = importData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = importData.reduce((sum, item) => sum + item.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileSpreadsheet className="h-6 w-6 text-green-600 ml-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">استيراد من Excel</h2>
            <p className="text-gray-600">استيراد الأرصدة الافتتاحية من ملف Excel</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-secondary">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center space-x-4 space-x-reverse">
        <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <span className="mr-2">رفع الملف</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <span className="mr-2">معاينة البيانات</span>
        </div>
        <div className="w-8 h-px bg-gray-300"></div>
        <div className={`flex items-center ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}>
            3
          </div>
          <span className="mr-2">اكتمال الاستيراد</span>
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="card p-6">
          <div className="text-center">
            <div className="mb-4">
              <button
                onClick={downloadTemplate}
                className="btn-secondary flex items-center mx-auto"
              >
                <Download className="h-4 w-4 ml-2" />
                تحميل القالب
              </button>
              <p className="text-sm text-gray-600 mt-2">
                قم بتحميل القالب وملء البيانات ثم ارفع الملف
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                اختر ملف Excel
              </p>
              <p className="text-gray-600 mb-4">
                أو اسحب الملف وأفلته هنا
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'جاري المعالجة...' : 'اختيار ملف'}
              </button>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  الملف المحدد: {file.name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Balance Check */}
          <div className={`card p-4 ${isBalanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isBalanced ? (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                )}
                <span className={`font-medium ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                  {isBalanced ? 'الميزان متوازن' : 'الميزان غير متوازن'}
                </span>
              </div>
              <div className="text-sm">
                <span className="ml-4">المدين: {(isNaN(totalDebit) || !isFinite(totalDebit) ? 0 : totalDebit).toLocaleString('ar-LY')}</span>
                <span>الدائن: {(isNaN(totalCredit) || !isFinite(totalCredit) ? 0 : totalCredit).toLocaleString('ar-LY')}</span>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                معاينة البيانات ({importData.length} حساب)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الحساب</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الحساب</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدين</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدائن</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importData.slice(0, 10).map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.accountCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.accountName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-left">
                        {item.debit > 0 ? (isNaN(item.debit) || !isFinite(item.debit) ? 0 : item.debit).toLocaleString('ar-LY') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-left">
                        {item.credit > 0 ? (isNaN(item.credit) || !isFinite(item.credit) ? 0 : item.credit).toLocaleString('ar-LY') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importData.length > 10 && (
              <div className="p-4 text-center text-sm text-gray-600">
                وعرض {importData.length - 10} حساب إضافي...
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button onClick={resetImporter} className="btn-secondary">
              إلغاء
            </button>
            <button
              onClick={handleImport}
              disabled={!isBalanced || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'جاري الاستيراد...' : 'تأكيد الاستيراد'}
            </button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="card p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            تم الاستيراد بنجاح!
          </h3>
          <p className="text-gray-600 mb-6">
            تم استيراد {importData.length} حساب بنجاح
          </p>
          <div className="flex justify-center space-x-4 space-x-reverse">
            <button onClick={resetImporter} className="btn-secondary">
              استيراد ملف آخر
            </button>
            {onClose && (
              <button onClick={onClose} className="btn-primary">
                إغلاق
              </button>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="card p-4 border-red-200 bg-red-50">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
            <h4 className="font-medium text-red-800">أخطاء في البيانات:</h4>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExcelImporter;
