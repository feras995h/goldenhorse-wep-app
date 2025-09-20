import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { financialAPI, salesAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface FinancialData {
  totalSales: number;
  totalPurchases: number;
  netProfit: number;
  cashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashBalance: number;
  bankBalance: number;
  monthlyGrowth: number;
}

interface SalesData {
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  totalInvoices: number;
  totalPayments: number;
  lowStockItems: number;
}

interface FinancialDataContextType {
  // Financial Summary Data
  financialData: FinancialData | null;
  salesData: SalesData | null;
  
  // Loading States
  financialLoading: boolean;
  salesLoading: boolean;
  
  // Error States
  financialError: string | null;
  salesError: string | null;
  
  // Actions
  refreshFinancialData: () => Promise<void>;
  refreshSalesData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // Update Functions
  updateSalesData: (type: 'customers' | 'invoices' | 'payments', data: any) => void;
  updateFinancialData: (data: Partial<FinancialData>) => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export const useFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};

interface FinancialDataProviderProps {
  children: ReactNode;
}

export const FinancialDataProvider: React.FC<FinancialDataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // State for Financial Data
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  
  // Loading States
  const [financialLoading, setFinancialLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  
  // Error States
  const [financialError, setFinancialError] = useState<string | null>(null);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Load Financial Data
  const loadFinancialData = async () => {
    setFinancialLoading(true);
    setFinancialError(null);
    try {
      const summary = await financialAPI.getFinancialSummary();
      setFinancialData(summary);
    } catch (error) {
      console.error('Error loading financial data:', error);
      setFinancialError('حدث خطأ في تحميل البيانات المالية');
    } finally {
      setFinancialLoading(false);
    }
  };

  // Load Sales Data
  const loadSalesData = async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      const summary = await salesAPI.getSalesSummary();
      setSalesData(summary);
    } catch (error) {
      console.error('Error loading sales data:', error);
      setSalesError('حدث خطأ في تحميل بيانات المبيعات');
    } finally {
      setSalesLoading(false);
    }
  };

  // Refresh Functions
  const refreshFinancialData = async () => {
    await loadFinancialData();
  };

  const refreshSalesData = async () => {
    await loadSalesData();
  };

  const refreshAllData = async () => {
    await Promise.all([loadFinancialData(), loadSalesData()]);
  };

  // Update Functions
  const updateSalesData = (type: 'customers' | 'invoices' | 'payments', data: any) => {
    if (type === 'customers' && salesData) {
      // Update customer-related data
      setSalesData(prev => prev ? {
        ...prev,
        activeCustomers: prev.activeCustomers + (data.isActive ? 1 : -1)
      } : null);
    } else if (type === 'invoices' && salesData) {
      // Update invoice-related data
      setSalesData(prev => prev ? {
        ...prev,
        totalInvoices: prev.totalInvoices + 1,
        totalSales: prev.totalSales + (data.total || 0)
      } : null);
    } else if (type === 'payments' && salesData) {
      // Update payment-related data
      setSalesData(prev => prev ? {
        ...prev,
        totalPayments: prev.totalPayments + 1
      } : null);
    }
  };

  const updateFinancialData = (data: Partial<FinancialData>) => {
    setFinancialData(prev => prev ? { ...prev, ...data } : null);
  };

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    await Promise.all([loadFinancialData(), loadSalesData()]);
  };

  const value: FinancialDataContextType = {
    financialData,
    salesData,
    financialLoading,
    salesLoading,
    financialError,
    salesError,
    refreshFinancialData,
    refreshSalesData,
    refreshAllData,
    updateSalesData,
    updateFinancialData,
  };

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export default FinancialDataProvider;
