import React, { useState, useRef } from 'react';
import { Printer, Download, FileText, Image, Globe, FileSpreadsheet, Eye } from 'lucide-react';
// import { useReactToPrint } from 'react-to-print';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import * as XLSX from 'xlsx';
import InvoiceTemplate from '../PrintTemplates/InvoiceTemplate';
import ReceiptTemplate from '../PrintTemplates/ReceiptTemplate';
import SalesReportTemplate from '../PrintTemplates/SalesReportTemplate';

// Mock implementations for libraries that might not be installed
const useReactToPrint = (options: any) => {
  return () => {
    if (options.content && options.content()) {
      window.print();
    }
  };
};

const html2canvas = async (element: HTMLElement, options?: any) => {
  // Mock implementation - in real app, this would use the actual html2canvas library
  return {
    toDataURL: () => 'data:image/png;base64,mock-image-data',
    height: 800,
    width: 600
  };
};

const jsPDF = class {
  constructor(orientation: string, unit: string, format: string) {}
  addImage(imgData: string, format: string, x: number, y: number, width: number, height: number) {}
  addPage() {}
  save(filename: string) {
    console.log('Saving PDF:', filename);
  }
};

const XLSX = {
  utils: {
    aoa_to_sheet: (data: any[][]) => ({ data }),
    book_new: () => ({ sheets: {} }),
    book_append_sheet: (workbook: any, worksheet: any, name: string) => {
      workbook.sheets[name] = worksheet;
    }
  },
  writeFile: (workbook: any, filename: string) => {
    console.log('Saving Excel file:', filename);
  }
};

interface PrintManagerProps {
  documentType: 'invoice' | 'receipt' | 'report';
  data: any;
  companyInfo: any;
  title?: string;
  showPreview?: boolean;
}

interface ExportFormat {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
}

const PrintManager: React.FC<PrintManagerProps> = ({
  documentType,
  data,
  companyInfo,
  title,
  showPreview = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(showPreview);
  const printRef = useRef<HTMLDivElement>(null);

  // Print function
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}`,
    onBeforeGetContent: () => {
      setIsExporting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsExporting(false);
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .print\\:hidden { display: none !important; }
        .print\\:block { display: block !important; }
        .print\\:shadow-none { box-shadow: none !important; }
        .print\\:max-w-none { max-width: none !important; }
      }
    `
  });

  // PDF Export
  const exportToPDF = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    setExportFormat('pdf');
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  // Excel Export
  const exportToExcel = () => {
    setIsExporting(true);
    setExportFormat('excel');
    
    try {
      let worksheetData: any[] = [];
      
      if (documentType === 'invoice' && data.items) {
        worksheetData = [
          ['فاتورة مبيعات', '', '', '', '', ''],
          ['رقم الفاتورة:', data.invoiceNumber, '', 'التاريخ:', data.date, ''],
          ['العميل:', data.customer?.name, '', 'نوع العميل:', data.customer?.customerType === 'foreign' ? 'أجنبي' : 'محلي', ''],
          ['', '', '', '', '', ''],
          ['#', 'الوصف', 'الكمية', 'سعر الوحدة', 'المجموع', 'العملة'],
          ...data.items.map((item: any, index: number) => [
            index + 1,
            item.description,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            data.currency
          ]),
          ['', '', '', '', '', ''],
          ['', '', '', 'المجموع الفرعي:', data.subtotal, data.currency],
          ['', '', '', 'الخصم:', data.discountAmount || 0, data.currency],
          ['', '', '', 'الضريبة:', data.taxAmount || 0, data.currency],
          ['', '', '', 'الإجمالي:', data.total, data.currency]
        ];
      } else if (documentType === 'receipt') {
        worksheetData = [
          ['إيصال ' + (data.voucherType === 'receipt' ? 'قبض' : 'صرف'), '', '', ''],
          ['رقم الإيصال:', data.receiptNo, 'التاريخ:', data.receiptDate],
          ['العميل:', data.customer?.name || 'غير محدد', 'نوع العميل:', data.customer?.customerType === 'foreign' ? 'أجنبي' : 'محلي'],
          ['المبلغ:', data.amount, 'العملة:', data.currency],
          ['طريقة الدفع:', data.paymentMethod, 'الحالة:', data.status],
          ['ملاحظات:', data.remarks || 'لا توجد', '', '']
        ];
      } else if (documentType === 'report' && Array.isArray(data)) {
        worksheetData = [
          ['تقرير المبيعات', '', '', '', '', '', '', '', '', '', ''],
          ['رقم الفاتورة', 'التاريخ', 'العميل', 'نوع العميل', 'المجموع الفرعي', 'الخصم', 'الضريبة', 'الإجمالي', 'المدفوع', 'الحالة', 'العملة'],
          ...data.map((item: any) => [
            item.invoiceNumber,
            item.date,
            item.customerName,
            item.customerType === 'foreign' ? 'أجنبي' : 'محلي',
            item.subtotal,
            item.discountAmount,
            item.taxAmount,
            item.total,
            item.paidAmount,
            item.paymentStatus === 'paid' ? 'مدفوعة' : item.paymentStatus === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة',
            item.currency
          ])
        ];
      }

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
      
      const fileName = `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  // CSV Export
  const exportToCSV = () => {
    setIsExporting(true);
    setExportFormat('csv');
    
    try {
      let csvContent = '';
      
      if (documentType === 'invoice' && data.items) {
        csvContent = [
          `فاتورة مبيعات,${data.invoiceNumber},${data.date}`,
          `العميل,${data.customer?.name},${data.customer?.customerType === 'foreign' ? 'أجنبي' : 'محلي'}`,
          '',
          'الوصف,الكمية,سعر الوحدة,المجموع',
          ...data.items.map((item: any) => 
            `"${item.description}",${item.quantity},${item.unitPrice},${item.totalPrice}`
          ),
          '',
          `المجموع الفرعي,${data.subtotal}`,
          `الخصم,${data.discountAmount || 0}`,
          `الضريبة,${data.taxAmount || 0}`,
          `الإجمالي,${data.total}`
        ].join('\n');
      } else if (documentType === 'receipt') {
        csvContent = [
          `إيصال ${data.voucherType === 'receipt' ? 'قبض' : 'صرف'},${data.receiptNo}`,
          `التاريخ,${data.receiptDate}`,
          `العميل,${data.customer?.name || 'غير محدد'}`,
          `المبلغ,${data.amount}`,
          `العملة,${data.currency}`,
          `طريقة الدفع,${data.paymentMethod}`,
          `الحالة,${data.status}`,
          `ملاحظات,"${data.remarks || 'لا توجد'}"`
        ].join('\n');
      }

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  // JSON Export
  const exportToJSON = () => {
    setIsExporting(true);
    setExportFormat('json');
    
    try {
      const jsonData = {
        documentType,
        exportDate: new Date().toISOString(),
        companyInfo,
        data
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  // PNG Export
  const exportToPNG = async () => {
    if (!printRef.current) return;
    
    setIsExporting(true);
    setExportFormat('png');
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  // HTML Export
  const exportToHTML = () => {
    setIsExporting(true);
    setExportFormat('html');
    
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title || documentType}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
            .document-title { font-size: 20px; font-weight: bold; color: #374151; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-label { font-weight: 600; color: #4b5563; }
            .info-value { color: #111827; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
            th { background-color: #3b82f6; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .total-section { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total-final { font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #3b82f6; padding-top: 8px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          ${printRef.current?.innerHTML || ''}
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title || documentType}-${data.invoiceNumber || data.receiptNo || 'report'}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
  };

  const exportFormats: ExportFormat[] = [
    {
      key: 'print',
      label: 'طباعة',
      icon: <Printer className="h-4 w-4" />,
      description: 'طباعة مباشرة',
      action: handlePrint
    },
    {
      key: 'pdf',
      label: 'PDF',
      icon: <FileText className="h-4 w-4" />,
      description: 'تصدير كملف PDF',
      action: exportToPDF
    },
    {
      key: 'excel',
      label: 'Excel',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      description: 'تصدير كملف Excel',
      action: exportToExcel
    },
    {
      key: 'csv',
      label: 'CSV',
      icon: <FileText className="h-4 w-4" />,
      description: 'تصدير كملف CSV',
      action: exportToCSV
    },
    {
      key: 'json',
      label: 'JSON',
      icon: <FileText className="h-4 w-4" />,
      description: 'تصدير كملف JSON',
      action: exportToJSON
    },
    {
      key: 'png',
      label: 'صورة',
      icon: <Image className="h-4 w-4" />,
      description: 'تصدير كصورة PNG',
      action: exportToPNG
    },
    {
      key: 'html',
      label: 'HTML',
      icon: <Globe className="h-4 w-4" />,
      description: 'تصدير كصفحة ويب',
      action: exportToHTML
    }
  ];

  const renderTemplate = () => {
    switch (documentType) {
      case 'invoice':
        return <InvoiceTemplate invoice={data} companyInfo={companyInfo} />;
      case 'receipt':
        return <ReceiptTemplate receipt={data} companyInfo={companyInfo} />;
      case 'report':
        return <SalesReportTemplate {...data} companyInfo={companyInfo} />;
      default:
        return <div>نوع المستند غير مدعوم</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">خيارات الطباعة والتصدير</h3>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4 ml-2" />
            {previewMode ? 'إخفاء المعاينة' : 'عرض المعاينة'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {exportFormats.map((format) => (
            <button
              key={format.key}
              onClick={format.action}
              disabled={isExporting}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                exportFormat === format.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={format.description}
            >
              <div className={`mb-2 ${exportFormat === format.key ? 'text-blue-600' : 'text-gray-600'}`}>
                {format.icon}
              </div>
              <span className="text-xs font-medium text-center">{format.label}</span>
              {exportFormat === format.key && (
                <div className="mt-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {isExporting && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-3"></div>
              <span className="text-sm text-blue-700">جاري التصدير...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preview */}
      {previewMode && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="font-medium text-gray-900">معاينة المستند</h4>
          </div>
          <div className="p-4">
            <div ref={printRef} className="print-content">
              {renderTemplate()}
            </div>
          </div>
        </div>
      )}

      {/* Hidden print content */}
      {!previewMode && (
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {renderTemplate()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintManager;
