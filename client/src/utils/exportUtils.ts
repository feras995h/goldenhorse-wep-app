// Export and Print Utilities for Financial System

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'excel' | 'csv';
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'letter';
}

export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'number' | 'date' | 'text';
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, any>[];
  totals?: Record<string, any>;
}

export class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export table data to various formats
   */
  public async exportTable(data: TableData, options: ExportOptions): Promise<void> {
    const { format } = options;

    switch (format) {
      case 'pdf':
        await this.exportToPDF(data, options);
        break;
      case 'excel':
        await this.exportToExcel(data, options);
        break;
      case 'csv':
        await this.exportToCSV(data, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PDF using browser's print functionality
   */
  private async exportToPDF(data: TableData, options: ExportOptions): Promise<void> {
    const { title, subtitle, orientation = 'portrait' } = options;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups.');
    }

    // Generate HTML content
    const htmlContent = this.generatePrintHTML(data, { title, subtitle, orientation });
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load
    printWindow.onload = () => {
      // Set print styles
      const style = printWindow.document.createElement('style');
      style.textContent = this.getPrintStyles(orientation);
      printWindow.document.head.appendChild(style);

      // Trigger print dialog
      printWindow.print();
      
      // Close window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }

  /**
   * Export to Excel format (CSV with Excel-compatible formatting)
   */
  private async exportToExcel(data: TableData, options: ExportOptions): Promise<void> {
    const { filename = 'export', title } = options;
    
    let csvContent = '';
    
    // Add title if provided
    if (title) {
      csvContent += `"${title}"\n\n`;
    }

    // Add headers
    const headers = data.columns.map(col => `"${col.title}"`).join(',');
    csvContent += headers + '\n';

    // Add data rows
    data.rows.forEach(row => {
      const rowData = data.columns.map(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        
        // Format based on column type
        switch (col.format) {
          case 'currency':
            return `"${this.formatCurrency(value)}"`;
          case 'number':
            return `"${this.formatNumber(value)}"`;
          case 'date':
            return `"${this.formatDate(value)}"`;
          default:
            return `"${String(value).replace(/"/g, '""')}"`;
        }
      }).join(',');
      csvContent += rowData + '\n';
    });

    // Add totals if provided
    if (data.totals) {
      csvContent += '\n';
      const totalsRow = data.columns.map(col => {
        const value = data.totals![col.key];
        if (value === null || value === undefined) return '""';
        return `"${col.format === 'currency' ? this.formatCurrency(value) : String(value)}"`;
      }).join(',');
      csvContent += totalsRow + '\n';
    }

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(data: TableData, options: ExportOptions): Promise<void> {
    // CSV export is the same as Excel export for our purposes
    await this.exportToExcel(data, options);
  }

  /**
   * Generate HTML content for printing
   */
  private generatePrintHTML(data: TableData, options: { title?: string; subtitle?: string; orientation?: string }): string {
    const { title, subtitle } = options;
    
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'تقرير'}</title>
      </head>
      <body>
        <div class="print-container">
    `;

    // Add header
    if (title || subtitle) {
      html += '<div class="print-header">';
      if (title) {
        html += `<h1 class="print-title">${title}</h1>`;
      }
      if (subtitle) {
        html += `<h2 class="print-subtitle">${subtitle}</h2>`;
      }
      html += `<div class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-LY')}</div>`;
      html += '</div>';
    }

    // Add table
    html += '<table class="print-table">';
    
    // Table header
    html += '<thead><tr>';
    data.columns.forEach(col => {
      html += `<th class="print-th" style="text-align: ${col.align || 'right'}">${col.title}</th>`;
    });
    html += '</tr></thead>';

    // Table body
    html += '<tbody>';
    data.rows.forEach(row => {
      html += '<tr>';
      data.columns.forEach(col => {
        const value = row[col.key];
        const formattedValue = this.formatValueForDisplay(value, col.format);
        html += `<td class="print-td" style="text-align: ${col.align || 'right'}">${formattedValue}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';

    // Table footer (totals)
    if (data.totals) {
      html += '<tfoot><tr>';
      data.columns.forEach(col => {
        const value = data.totals![col.key];
        const formattedValue = value ? this.formatValueForDisplay(value, col.format) : '';
        html += `<td class="print-td print-total" style="text-align: ${col.align || 'right'}">${formattedValue}</td>`;
      });
      html += '</tr></tfoot>';
    }

    html += '</table>';
    html += '</div></body></html>';

    return html;
  }

  /**
   * Get CSS styles for printing
   */
  private getPrintStyles(orientation: string = 'portrait'): string {
    return `
      @page {
        size: A4 ${orientation};
        margin: 1cm;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        margin: 0;
        padding: 0;
      }
      
      .print-container {
        width: 100%;
        max-width: none;
      }
      
      .print-header {
        text-align: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
      }
      
      .print-title {
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 5px 0;
      }
      
      .print-subtitle {
        font-size: 14px;
        margin: 0 0 5px 0;
        color: #666;
      }
      
      .print-date {
        font-size: 10px;
        color: #666;
      }
      
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      
      .print-th,
      .print-td {
        border: 1px solid #000;
        padding: 6px 8px;
        vertical-align: top;
      }
      
      .print-th {
        background-color: #f0f0f0;
        font-weight: bold;
        text-align: center;
      }
      
      .print-td {
        font-size: 11px;
      }
      
      .print-total {
        font-weight: bold;
        background-color: #f9f9f9;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .print-table {
          page-break-inside: auto;
        }
        
        .print-table tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        .print-th {
          page-break-after: avoid;
        }
      }
    `;
  }

  /**
   * Format value for display based on type
   */
  private formatValueForDisplay(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'currency':
        return this.formatCurrency(value);
      case 'number':
        return this.formatNumber(value);
      case 'date':
        return this.formatDate(value);
      default:
        return String(value);
    }
  }

  /**
   * Format currency values
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-LY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    }).format(value);
  }

  /**
   * Format number values
   */
  private formatNumber(value: number): string {
    return new Intl.NumberFormat('ar-LY', {
      useGrouping: true
    }).format(value);
  }

  /**
   * Format date values
   */
  private formatDate(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('ar-LY');
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Print current page
   */
  public printCurrentPage(): void {
    window.print();
  }

  /**
   * Export financial report
   */
  public async exportFinancialReport(
    reportType: string,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    // This would integrate with the backend API for server-side PDF generation
    try {
      const response = await fetch('/api/financial/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reportType,
          data,
          options
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const filename = options.filename || `${reportType}-${new Date().toISOString().split('T')[0]}`;
      const extension = options.format === 'pdf' ? 'pdf' : 'xlsx';
      
      this.downloadBlob(blob, `${filename}.${extension}`);
    } catch (error) {
      console.error('Export error:', error);
      // Fallback to client-side export
      await this.exportTable(data, options);
    }
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance();
