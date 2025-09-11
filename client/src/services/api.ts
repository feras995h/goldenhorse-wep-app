import axios from 'axios';
import { LoginCredentials, AuthResponse, User } from '../types/auth';

const API_BASE_URL = 'http://localhost:5001/api';

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

  // Customers
  getCustomers: async (params?: { page?: number; limit?: number; search?: string; type?: string }) => {
    const response = await api.get('/financial/customers', { params });
    return response.data;
  },

  createCustomer: async (customerData: any) => {
    const response = await api.post('/financial/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id: string, customerData: any) => {
    const response = await api.put(`/financial/customers/${id}`, customerData);
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

  // Financial Reports
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
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
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

export default api;
