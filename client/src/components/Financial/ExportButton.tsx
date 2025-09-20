import React, { useState } from 'react';
import { Download, FileText, Table, Printer, ChevronDown, Image, FileImage, Mail } from 'lucide-react';
import { exportService, ExportOptions, TableData } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  data: TableData;
  filename?: string;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  title,
  subtitle,
  disabled = false,
  className = '',
  variant = 'secondary',
  size = 'md',
  showDropdown = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    {
      format: 'pdf' as const,
      label: 'تصدير PDF',
      icon: FileText,
      description: 'ملف PDF للطباعة والمشاركة'
    },
    {
      format: 'excel' as const,
      label: 'تصدير Excel',
      icon: Table,
      description: 'ملف Excel للتحليل والتعديل'
    },
    {
      format: 'csv' as const,
      label: 'تصدير CSV',
      icon: Download,
      description: 'ملف CSV للاستيراد في برامج أخرى'
    }
  ];

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (disabled || isExporting) return;

    try {
      setIsExporting(true);
      setIsOpen(false);

      // Only handle supported formats
      if (!['pdf', 'excel', 'csv'].includes(format)) {
        console.warn(`Export format '${format}' not yet implemented`);
        return;
      }

      const options: ExportOptions = {
        format: format as 'pdf' | 'excel' | 'csv',
        filename: filename || `export-${new Date().toISOString().split('T')[0]}`,
        title,
        subtitle,
        orientation: 'landscape',
        pageSize: 'A4'
      };

      await exportService.exportTable(data, options);
    } catch (error) {
      console.error('Export failed:', error);
      alert('فشل في تصدير الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (disabled) return;
    exportService.printCurrentPage();
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;
  };

  if (!showDropdown) {
    // Simple export button (defaults to PDF)
    return (
      <button
        onClick={() => handleExport('pdf')}
        disabled={disabled || isExporting}
        className={getButtonClasses()}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
            جاري التصدير...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative inline-block text-right">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={getButtonClasses()}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
            جاري التصدير...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 ml-2" />
            تصدير
            <ChevronDown className="h-4 w-4 mr-1" />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {/* Print Option */}
              <button
                onClick={handlePrint}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Printer className="h-4 w-4 ml-3 text-gray-400" />
                <div className="text-right">
                  <div className="font-medium">طباعة</div>
                  <div className="text-xs text-gray-500">طباعة الصفحة الحالية</div>
                </div>
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Export Options */}
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => {
                    if (['pdf', 'excel', 'csv'].includes(option.format)) {
                      handleExport(option.format as 'pdf' | 'excel' | 'csv');
                    } else {
                      handlePrint();
                    }
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <option.icon className="h-4 w-4 ml-3 text-gray-400" />
                  <div className="text-right">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
