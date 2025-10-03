import axios from 'axios';
import { LoginCredentials, AuthResponse, User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  verifyToken: async (token: string): Promise<User> => {
    const response = await api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

export const settingsAPI = {
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      // Return default settings if API call fails
      return {
        logo: {
          filename: null,
          originalName: null,
          uploadDate: null,
          size: null,
          mimetype: null
        },
        lastUpdated: new Date().toISOString()
      };
    }
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getLogoUrl: () => {
    return `${API_BASE_URL}/settings/logo`;
  },

  deleteLogo: async () => {
    const response = await api.delete('/settings/logo');
    return response.data;
  },
};

export const financialAPI = {
  // Accounts
  getAccounts: async (params?: { page?: number; limit?: number; search?: string; type?: string }) => {
    const response = await api.get('/financial/accounts', { params });
    return response.data;
  },

  createAccount: async (accountData: any) => {
    const response = await api.post('/financial/accounts', accountData);
    return response.data;
  },

  updateAccount: async (id: string, accountData: any) => {
    const response = await api.put(`/financial/accounts/${id}`, accountData);
    return response.data;
  },

  deleteAccount: async (id: string) => {
    const response = await api.delete(`/financial/accounts/${id}`);
    return response.data;
  },


  // Accounts Autocomplete
  getAccountsAutocomplete: async (params?: { search?: string; limit?: number }) => {
    const response = await api.get('/financial/accounts/autocomplete', { params });
    return response.data;
  },

  // Outstanding Invoices for an account
  getOutstandingInvoices: async (params: { accountId: string; limit?: number }) => {
    const response = await api.get('/financial/invoices/outstanding', { params });
    return response.data;
  },

  // Customers
  getCustomers: async (params?: { page?: number; limit?: number; search?: string; type?: string }) => {
    const response = await api.get('/financial/customers', { params });
    return response.data;
  },

  createCustomer: async (customerData: any) => {
    // المدير المالي لا يمكنه إنشاء عملاء - هذه مهمة موظف المبيعات
    const response = await api.post('/sales/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id: string, customerData: any) => {
    // المدير المالي لا يمكنه تعديل العملاء - هذه مهمة موظف المبيعات
    const response = await api.put(`/sales/customers/${id}`, customerData);
    return response.data;
  },

  getCustomer: async (id: string) => {
    const response = await api.get(`/financial/customers/${id}`);
    return response.data;
  },

  // Employees
  getEmployees: async (params?: { page?: number; limit?: number; search?: string; department?: string; isActive?: boolean }) => {
    const response = await api.get('/financial/employees', { params });
    return response.data;
  },

  createEmployee: async (employeeData: any) => {
    const response = await api.post('/financial/employees', employeeData);
    return response.data;
  },

  updateEmployee: async (id: string, employeeData: any) => {
    const response = await api.put(`/financial/employees/${id}`, employeeData);
    return response.data;
  },

  getEmployee: async (id: string) => {
    const response = await api.get(`/financial/employees/${id}`);
    return response.data;
  },

  getEmployeeSummary: async () => {
    const response = await api.get('/financial/employees/summary');
    return response.data;
  },

  getEmployeeAccountStatement: async (employeeId: string) => {
    const response = await api.get(`/financial/employees/${employeeId}/account-statement`);
    return response.data;
  },

  // Journal Entries
  getJournalEntries: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/financial/journal-entries', { params });
    return response.data;
  },

  createJournalEntry: async (entryData: any) => {
    const response = await api.post('/financial/journal-entries', entryData);
    return response.data;
  },

  updateJournalEntry: async (id: string, entryData: any) => {
    const response = await api.put(`/financial/journal-entries/${id}`, entryData);
    return response.data;
  },

  getJournalEntry: async (id: string) => {
    const response = await api.get(`/financial/journal-entries/${id}`);
    return response.data;
  },

  approveJournalEntry: async (id: string) => {
    const response = await api.post(`/financial/journal-entries/${id}/submit`);
    return response.data;
  },

  // Opening Balances
  getOpeningBalances: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/financial/opening-balances', { params });
    return response.data;
  },

  createOpeningBalance: async (balanceData: any) => {
    const response = await api.post('/financial/opening-balances', balanceData);
    return response.data;
  },

  updateOpeningBalance: async (id: string, balanceData: any) => {
    const response = await api.put(`/financial/opening-balances/${id}`, balanceData);
    return response.data;
  },

  deleteOpeningBalance: async (id: string) => {
    const response = await api.delete(`/financial/opening-balances/${id}`);
    return response.data;
  },

  createOpeningBalanceEntry: async (entryData: any) => {
    const response = await api.post('/financial/opening-balance-entry', entryData);
    return response.data;
  },

  // Fixed Assets
  getFixedAssets: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  }) => {
    const response = await api.get('/financial/fixed-assets', { params });
    return response.data;
  },

  createFixedAsset: async (assetData: any) => {
    const response = await api.post('/financial/fixed-assets', assetData);
    return response.data;
  },

  updateFixedAsset: async (id: string, assetData: any) => {
    const response = await api.put(`/financial/fixed-assets/${id}`, assetData);
    return response.data;
  },

  getFixedAsset: async (id: string) => {
    const response = await api.get(`/financial/fixed-assets/${id}`);
    return response.data;
  },

  calculateDepreciation: async (id: string) => {
    const response = await api.post(`/financial/fixed-assets/${id}/depreciation`);
    return response.data;
  },

  getFixedAssetCategories: async () => {
    const response = await api.get('/financial/fixed-assets/categories');
    return response.data;
  },

  // Financial Reports
  getOpeningTrialBalance: async (params?: { asOfDate?: string; currency?: string; branch?: string }) => {
    const response = await api.get('/financial/reports/opening-trial-balance', { params });
    return response.data;
  },

  getTrialBalance: async (params: {
    dateFrom: string;
    dateTo: string;
    currency?: string;
    branch?: string;
  }) => {
    const response = await api.get('/financial/reports/trial-balance', { params });
    return response.data;
  },

  getIncomeStatement: async (params: {
    dateFrom: string;
    dateTo: string;
    currency?: string;
    branch?: string;
  }) => {
    const response = await api.get('/financial/reports/income-statement', { params });
    return response.data;
  },

  getBalanceSheet: async (params: {
    dateFrom: string;
    dateTo: string;
    currency?: string;
    branch?: string;
  }) => {
    const response = await api.get('/financial/reports/balance-sheet', { params });
    return response.data;
  },

  getCashFlowStatement: async (params: {
    dateFrom: string;
    dateTo: string;
    currency?: string;
    branch?: string;
  }) => {
    const response = await api.get('/financial/reports/cash-flow', { params });
    return response.data;
  },

  // General Ledger Entries (alias for instant GL detail)
  getGLEntries: async (params: {
    page?: number;
    limit?: number;
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    period?: string;
  }) => {
    // If backend provides a specific GL entries endpoint, use it; fallback to journal entries
    try {
      const response = await api.get('/financial/reports/gl-entries', { params });
      return response.data;
    } catch {
      const response = await api.get('/financial/journal-entries', { params });
      return response.data;
    }
  },

  // Get receivables details
  getReceivablesDetails: async (params: {
    period?: string;
    limit?: number;
  }) => {
    return api.get('/financial/receivables-details', { params });
  },

  exportReport: async (params: {
    type: string;
    format: 'pdf' | 'excel';
    dateFrom: string;
    dateTo: string;
    currency?: string;
    branch?: string;
  }) => {
    const response = await api.get('/financial/reports/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  // System Health
  getSystemHealth: async () => {
    const response = await api.get('/financial/system-health');
    return response.data;
  },

  recalculateBalances: async () => {
    const response = await api.post('/financial/recalculate-balances');
    return response.data;
  },

  installTriggers: async () => {
    const response = await api.post('/financial/install-triggers');
    return response.data;
  },

  repairMissingJournalEntries: async () => {
    const response = await api.post('/financial/repair-missing-journal-entries');
    return response.data;
  },

  runMonthlyDepreciation: async (date?: string) => {
    const response = await api.post('/financial/fixed-assets/depreciation/run', { date });
    return response.data;
  },

  // Accounting Periods
  getCurrentAccountingPeriod: async () => {
    try {
      const response = await api.get('/accounting-periods/current');
      return response.data; // { success, data }
    } catch (e: any) {
      // 404 -> no current period
      if (e?.response?.status === 404) return { success: false, data: null };
      throw e;
    }
  },
  createAccountingPeriod: async (year: number, month: number, notes?: string) => {
    const response = await api.post('/accounting-periods', { year, month, notes });
    return response.data;
  },

  // Invoices without journal entry
  getInvoicesWithoutJournal: async (limit: number = 50) => {
    const response = await api.get('/financial/invoices-without-journal', { params: { limit } });
    return response.data;
  },

  // Financial Summary
  getFinancialSummary: async () => {
    const response = await api.get('/financial/summary');
    return response.data;
  },

  // Account Statement
  getAccountStatement: async (accountId: string, params: {
    fromDate: string;
    toDate: string;
  }) => {
    const response = await api.get(`/financial/accounts/${accountId}/statement`, { params });
    return response.data;
  },

  // Instant Reports
  getInstantReports: async (params: {
    period?: string;
  }) => {
    const response = await api.get('/financial/instant-reports', { params });
    return response.data;
  },

  // Monitored Accounts
  getMonitoredAccounts: async () => {
    const response = await api.get('/financial/monitored-accounts');
    return response.data;
  },

  createMonitoredAccount: async (accountData: any) => {
    const response = await api.post('/financial/monitored-accounts', accountData);
    return response.data;
  },

  deleteMonitoredAccount: async (accountId: string) => {
    const response = await api.delete(`/financial/monitored-accounts/${accountId}`);
    return response.data;
  },

  // Vouchers
  createReceiptVoucher: async (data: any) => {
    const response = await api.post('/financial/vouchers/receipts', data);
    return response.data;
  },

  createPaymentVoucher: async (data: any) => {
    const response = await api.post('/financial/vouchers/payments', data);
    return response.data;
  },


  // Payroll Management
  getPayrollEntries: async (params: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
    status?: string;
    department?: string;
  }) => {
    const response = await api.get('/financial/payroll', { params });
    return response.data;
  },

  createPayrollEntry: async (data: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances?: number;
    deductions?: number;
    overtime?: number;
    bonuses?: number;
    paymentMethod?: 'bank' | 'cash';
    remarks?: string;
  }) => {
    const response = await api.post('/financial/payroll', data);
    return response.data;
  },

  updatePayrollEntry: async (id: string, data: {
    basicSalary?: number;
    allowances?: number;
    deductions?: number;
    overtime?: number;
    bonuses?: number;
    paymentMethod?: 'bank' | 'cash';
    remarks?: string;
  }) => {
    const response = await api.put(`/financial/payroll/${id}`, data);
    return response.data;
  },

  approvePayrollEntry: async (id: string) => {
    const response = await api.post(`/financial/payroll/${id}/approve`);
    return response.data;
  },

  payPayrollEntry: async (id: string) => {
    const response = await api.post(`/financial/payroll/${id}/pay`);
    return response.data;
  },

  // Employee Advances
  getEmployeeAdvances: async (employeeId: string) => {
    const response = await api.get(`/financial/employees/${employeeId}/advances`);
    return response.data;
  },

  // Employee Salaries
  getEmployeeSalaries: async (employeeId: string) => {
    const response = await api.get(`/financial/employees/${employeeId}/salaries`);
    return response.data;
  },

  // Employee Bonds
  getEmployeeBonds: async (employeeId: string) => {
    const response = await api.get(`/financial/employees/${employeeId}/bonds`);
    return response.data;
  },


  // Raw passthrough (used in a few legacy places)
  get: async (url: string, config?: any) => {
    const response = await api.get(url, config);
    return response.data;
  },

  createAdvanceRequest: async (data: {
    employeeId: string;
    amount: number;
    reason: string;
    paymentMethod?: 'bank' | 'cash';
    installments?: number;
    remarks?: string;
  }) => {
    const response = await api.post('/financial/advances', data);
    return response.data;
  },

  approveAdvanceRequest: async (id: string) => {
    const response = await api.post(`/financial/advances/${id}/approve`);
    return response.data;
  },

  payAdvanceRequest: async (id: string) => {
    const response = await api.post(`/financial/advances/${id}/pay`);
    return response.data;
  },
};

export const salesAPI = {
  // Customers
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'individual' | 'company';
    status?: 'active' | 'inactive';
  }) => {
    const response = await api.get('/sales/customers', { params });
    return response.data;
  },

  getCustomer: async (id: string) => {
    const response = await api.get(`/sales/customers/${id}`);
    return response.data;
  },

  createCustomer: async (customerData: {
    code: string;
    name: string;
    nameEn?: string;
    type?: 'individual' | 'company';
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    creditLimit?: number;
    paymentTerms?: number;
    currency?: 'LYD' | 'USD' | 'EUR' | 'CNY';
    contactPerson?: string;
  }) => {
    const response = await api.post('/sales/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id: string, customerData: {
    code?: string;
    name?: string;
    nameEn?: string;
    type?: 'individual' | 'company';
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    creditLimit?: number;
    paymentTerms?: number;
    currency?: 'LYD' | 'USD' | 'EUR' | 'CNY';
    contactPerson?: string;
  }) => {
    const response = await api.put(`/sales/customers/${id}`, customerData);
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await api.delete(`/sales/customers/${id}`);
    return response.data;
  },

  // Invoices
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/sales/invoices', { params });
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await api.get(`/sales/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (invoiceData: {
    customerId: string;
    date: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    notes?: string;
    terms?: string;
  }) => {
    const response = await api.post('/sales/invoices', invoiceData);
    return response.data;
  },

  updateInvoice: async (id: string, invoiceData: any) => {
    const response = await api.put(`/sales/invoices/${id}`, invoiceData);
    return response.data;
  },

  // Shipping Invoices
  getShippingInvoices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
    customerId?: string;
  }) => {
    const response = await api.get('/sales/shipping-invoices', { params });
    return response.data;
  },

  createShippingInvoice: async (data: {
    customerId: string;
    date: string;
    dueDate: string;
    currency?: string;
    exchangeRate?: number;
    itemDescription?: string;
    notes?: string;
  }) => {
    const response = await api.post('/sales/shipping-invoices', data);
    return response.data;
  },

  updateShippingInvoice: async (id: string, data: any) => {
    const response = await api.put(`/sales/shipping-invoices/${id}`, data);
    return response.data;
  },

  deleteShippingInvoice: async (id: string) => {
    const response = await api.delete(`/sales/shipping-invoices/${id}`);
    return response.data;
  },

  recordShippingInvoicePayment: async (id: string, data: { amount: number; method?: string; reference?: string; date?: string; }) => {
    const response = await api.post(`/sales/shipping-invoices/${id}/payment`, data);
    return response.data;
  },

  // Payments
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/sales/payments', { params });
    return response.data;
  },

  createPayment: async (paymentData: {
    customerId: string;
    amount: number;
    date: string;
    paymentMethod?: 'cash' | 'bank' | 'card' | 'check';
    description?: string;
    reference?: string;
  }) => {
    const response = await api.post('/sales/payments', paymentData);
    return response.data;
  },

  // Shipments Summary (International Shipping KPIs)
  getShipmentsSummary: async () => {
    try {
      const response = await api.get('/sales/shipments/summary');
      return response.data;
    } catch (e) {
      return { success: false, data: { statuses: {}, payments: {} } };
    }
  },

  // ETA Metrics and Top Delays
  getShipmentsEtaMetrics: async () => {
    const response = await api.get('/sales/shipments/eta-metrics');
    return response.data;
  },
  getTopDelayedShipments: async (limit: number = 10) => {
    const response = await api.get('/sales/shipments/top-delays', { params: { limit } });
    return response.data;
  },

  // Analytics
  getSalesAnalytics: async (params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
  }) => {
    const response = await api.get('/sales/analytics', { params });
    return response.data;
  },

  // Sales Summary
  getSalesSummary: async () => {
    try {
      const response = await api.get('/sales/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      // Return default data if API fails
      return {
        totalSales: 0,
        totalOrders: 0,
        activeCustomers: 0,
        averageOrderValue: 0,
        monthlyGrowth: 0,
        totalInvoices: 0,
        totalPayments: 0,
        lowStockItems: 0
      };
    }
  },

  // Inventory Management
  getInventory: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  }) => {
    const response = await api.get('/sales/inventory', { params });
    return response.data;
  },

  createInventoryItem: async (itemData: {
    code: string;
    name: string;
    nameEn?: string;
    category: string;
    unit: string;
    currentStock?: number;
    minStock?: number;
    maxStock?: number;
    unitCost?: number;
    sellingPrice?: number;
    location?: string;
    supplier?: string;
    barcode?: string;
    description?: string;
  }) => {
    const response = await api.post('/sales/inventory', itemData);
    return response.data;
  },

  updateInventoryItem: async (id: string, itemData: any) => {
    const response = await api.put(`/sales/inventory/${id}`, itemData);
    return response.data;
  },

  recordStockMovement: async (itemId: string, movementData: {
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    reference?: string;
    notes?: string;
  }) => {
    const response = await api.post(`/sales/inventory/${itemId}/movement`, movementData);
    return response.data;
  },

  getStockMovements: async (itemId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get(`/sales/inventory/${itemId}/movements`, { params });
    return response.data;
  },

  // Sales Invoices (v2)
  getSalesInvoicesV2: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    salesPerson?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/sales/sales-invoices', { params });
    return response.data;
  },

  getSalesInvoiceV2: async (id: string) => {
    const response = await api.get(`/sales/sales-invoices/${id}`);
    return response.data;
  },

  createSalesInvoiceV2: async (data: any) => {
    const response = await api.post('/sales/sales-invoices', data);
    return response.data;
  },

  updateSalesInvoiceV2: async (id: string, data: any) => {
    const response = await api.put(`/sales/sales-invoices/${id}`, data);
    return response.data;
  },

  deleteSalesInvoiceV2: async (id: string) => {
    const response = await api.delete(`/sales/sales-invoices/${id}`);
    return response.data;
  },

  recordSalesInvoicePayment: async (
    id: string,
    data: { amount: number; paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'account_credit'; paymentReference?: string; date?: string; counterAccountId?: string; notes?: string }
  ) => {
    const response = await api.post(`/sales/sales-invoices/${id}/payment`, data);
    return response.data;
  },

  // Sales Reports
  getSalesReports: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    productCategory?: string;
    reportType?: 'summary' | 'detailed' | 'customer' | 'product';
  }) => {
    const response = await api.get('/sales/reports', { params });
    return response.data;
  },

  // Stock balance for shipment (via StockMovement ledger)
  getShipmentStockBalance: async (shipmentId: string) => {
    const response = await api.get(`/sales/stock/shipments/${shipmentId}/balance`);
    return response.data as {
      shipmentId: string;
      trackingNumber: string;
      receivedQty: number;
      releasedQty: number;
      available: number;
    };
  },

  // Stock movements for shipment
  getShipmentStockMovements: async (shipmentId: string) => {
    const response = await api.get(`/sales/stock/shipments/${shipmentId}/movements`);
    return response.data as { data: Array<any> };
  },

  // Shipment movements (tracking)
  createShipmentMovement: async (shipmentId: string, data: {
    type: 'status_update' | 'location_change' | 'delivery_attempt';
    newStatus: string;
    location?: string;
    notes?: string;
    handledBy?: string;
  }) => {
    const response = await api.post(`/sales/shipments/${shipmentId}/movements`, data);
    return response.data;
  },

  getShipmentMovements: async (shipmentId: string) => {
    const response = await api.get(`/sales/shipments/${shipmentId}/movements`);
    return response.data;
  },

  // Warehouse Release Orders (inline from shipments)
  createWarehouseReleaseOrder: async (data: {
    shipmentId?: string;
    trackingNumber?: string;
    requestedBy: string;
    requestedByPhone?: string;
    warehouseLocation: string;
    storageFeesAmount?: number;
    handlingFeesAmount?: number;
    paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'other';
    paymentReference?: string;
    notes?: string;
  }) => {
    const response = await api.post('/sales/warehouse-release-orders', data);
    return response.data;
  },

  // Sales Returns
  getSalesReturns: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await api.get('/sales/returns', { params });
    return response.data;
  },

  getSalesReturn: async (id: string) => {
    const response = await api.get(`/sales/returns/${id}`);
    return response.data;
  },

  createSalesReturn: async (data: {
    customerId: string;
    originalInvoiceId?: string;
    date: string;
    reason: string;
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    notes?: string;
  }) => {
    const response = await api.post('/sales/returns', data);
    return response.data;
  },

  cancelSalesReturn: async (id: string) => {
    const response = await api.post(`/sales/returns/${id}/cancel`);
    return response.data;
  }
};

// Admin API for user and role management
export const adminAPI = {
  // Users management
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  createUser: async (userData: any) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  toggleUserStatus: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/toggle-status`);
    return response.data;
  },
  resetUserPassword: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  // Roles management
  getRoles: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/admin/roles', { params });
    return response.data;
  },
  createRole: async (roleData: any) => {
    const response = await api.post('/admin/roles', roleData);
    return response.data;
  },
  updateRole: async (id: string, roleData: any) => {
    const response = await api.put(`/admin/roles/${id}`, roleData);
    return response.data;
  },
  getRole: async (id: string) => {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data;
  },
  deleteRole: async (id: string) => {
    const response = await api.delete(`/admin/roles/${id}`);
    return response.data;
  },

  // Permissions management
  getPermissions: async () => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },
  updateRolePermissions: async (roleId: string, permissions: string[]) => {
    const response = await api.put(`/admin/roles/${roleId}/permissions`, { permissions });
    return response.data;
  },

  // System statistics
  getSystemStats: async () => {
    const response = await api.get('/admin/system-stats');
    return response.data;
  },
  getAuditLogs: async (params?: { page?: number; limit?: number; userId?: string; action?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  // Admin overview and summary data
  getOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  getFinancialSummary: async () => {
    const response = await api.get('/admin/financial-summary');
    return response.data;
  },

  getSalesSummary: async () => {
    const response = await api.get('/admin/sales-summary');
    return response.data;
  }
};


// AR (Accounts Receivable) API
export const arAPI = {
  getOpenInvoices: async (params: { customer_id?: string; page?: number; limit?: number }) => {
    const response = await api.get('/ar/open-invoices', { params });
    return response.data;
  },
  getCustomerReceipts: async (params: { customer_id: string }) => {
    const response = await api.get('/ar/receipts', { params });
    return response.data;
  },
  allocate: async (data: { receipt_id: string; invoice_id: string; amount: number; notes?: string }) => {
    const response = await api.post('/ar/allocate', data);
    return response.data;
  },
  getAging: async (params: { as_of?: string; customer_id?: string }) => {
    const response = await api.get('/ar/aging', { params });
    return response.data;
  },
  allocateBatch: async (data: { allocations: Array<{ receipt_id: string; invoice_id: string; amount: number; notes?: string }> }) => {
    const response = await api.post('/ar/allocate-batch', data);
    return response.data;
  },
  getAllocations: async (params?: { customer_id?: string; invoice_id?: string; receipt_id?: string; page?: number; limit?: number }) => {
    const response = await api.get('/ar/allocations', { params });
    return response.data;
  },
  unallocate: async (data: { allocation_id: string; reason?: string }) => {
    const response = await api.post('/ar/unallocate', data);
    return response.data;
  }

};

export default api;
