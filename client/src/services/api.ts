import axios from 'axios';
import { LoginCredentials, AuthResponse, User } from '../types/auth';

const API_BASE_URL = '/api';

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
  getEmployeeAdvances: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
  }) => {
    const response = await api.get('/financial/advances', { params });
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

export default api;
