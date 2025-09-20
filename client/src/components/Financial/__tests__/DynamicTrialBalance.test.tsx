import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import DynamicTrialBalance from '../DynamicTrialBalance';
import * as api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock the WebSocket hook
jest.mock('../../../hooks/useWebSocket', () => ({
  useFinancialUpdates: jest.fn(() => ({
    isConnected: true
  }))
}));

const mockTrialBalanceData = {
  accounts: [
    {
      id: 'account-1',
      code: 'CASH001',
      name: 'Cash Account',
      type: 'asset',
      level: 1,
      isGroup: false,
      debit: 5000,
      credit: 0,
      balance: 5000,
      currency: 'LYD'
    },
    {
      id: 'account-2',
      code: 'REV001',
      name: 'Revenue Account',
      type: 'revenue',
      level: 1,
      isGroup: false,
      debit: 0,
      credit: 3000,
      balance: 3000,
      currency: 'LYD'
    },
    {
      id: 'account-3',
      code: 'EXP001',
      name: 'Expense Account',
      type: 'expense',
      level: 1,
      isGroup: false,
      debit: 2000,
      credit: 0,
      balance: 2000,
      currency: 'LYD'
    }
  ],
  totals: {
    totalDebits: 7000,
    totalCredits: 3000,
    difference: 4000
  },
  asOfDate: '2024-01-15',
  generatedAt: '2024-01-15T10:00:00Z',
  isBalanced: false
};

describe('DynamicTrialBalance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockedApi.financialAPI = {
      get: jest.fn().mockResolvedValue({
        data: {
          success: true,
          data: mockTrialBalanceData
        }
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    } as any;
  });

  test('renders trial balance correctly', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('ميزان المراجعة')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('إجمالي المدين')).toBeInTheDocument();
    expect(screen.getByText('إجمالي الدائن')).toBeInTheDocument();
    expect(screen.getByText('الفرق')).toBeInTheDocument();

    // Check account data
    expect(screen.getByText('CASH001')).toBeInTheDocument();
    expect(screen.getByText('Cash Account')).toBeInTheDocument();
    expect(screen.getByText('REV001')).toBeInTheDocument();
    expect(screen.getByText('Revenue Account')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<DynamicTrialBalance />);

    expect(screen.getByText('جاري تحميل ميزان المراجعة...')).toBeInTheDocument();
  });

  test('handles API call with correct parameters', async () => {
    const asOfDate = '2024-01-15';
    render(<DynamicTrialBalance asOfDate={asOfDate} showHierarchy={true} />);

    await waitFor(() => {
      expect(mockedApi.financialAPI.get).toHaveBeenCalledWith('/reports/trial-balance', {
        params: {
          asOfDate: asOfDate,
          includeHierarchy: true
        }
      });
    });
  });

  test('displays connection status correctly', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('متصل')).toBeInTheDocument();
    });
  });

  test('handles disconnected state', async () => {
    // Mock disconnected state
    const { useFinancialUpdates } = require('../../../hooks/useWebSocket');
    useFinancialUpdates.mockReturnValue({ isConnected: false });

    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('غير متصل')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('ميزان المراجعة')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /تحديث/ });
    fireEvent.click(refreshButton);

    // Should make another API call
    await waitFor(() => {
      expect(mockedApi.financialAPI.get).toHaveBeenCalledTimes(2);
    });
  });

  test('filters accounts by search term', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('Cash Account')).toBeInTheDocument();
      expect(screen.getByText('Revenue Account')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('البحث في الحسابات...');
    fireEvent.change(searchInput, { target: { value: 'Cash' } });

    // Should show only Cash Account
    expect(screen.getByText('Cash Account')).toBeInTheDocument();
    expect(screen.queryByText('Revenue Account')).not.toBeInTheDocument();
  });

  test('filters accounts by type', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('Cash Account')).toBeInTheDocument();
      expect(screen.getByText('Revenue Account')).toBeInTheDocument();
    });

    const typeFilter = screen.getByDisplayValue('كل الأنواع');
    fireEvent.change(typeFilter, { target: { value: 'asset' } });

    // Should show only asset accounts
    expect(screen.getByText('Cash Account')).toBeInTheDocument();
    expect(screen.queryByText('Revenue Account')).not.toBeInTheDocument();
  });

  test('displays account type labels correctly', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('أصول')).toBeInTheDocument(); // Asset
      expect(screen.getByText('إيرادات')).toBeInTheDocument(); // Revenue
      expect(screen.getByText('مصروفات')).toBeInTheDocument(); // Expense
    });
  });

  test('displays balance amounts correctly', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      // Check formatted numbers
      expect(screen.getByText('5,000')).toBeInTheDocument(); // Cash debit
      expect(screen.getByText('3,000')).toBeInTheDocument(); // Revenue credit
      expect(screen.getByText('2,000')).toBeInTheDocument(); // Expense debit
    });
  });

  test('displays summary totals correctly', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('7,000')).toBeInTheDocument(); // Total debits
      expect(screen.getByText('3,000')).toBeInTheDocument(); // Total credits (appears twice)
      expect(screen.getByText('4,000')).toBeInTheDocument(); // Difference
    });
  });

  test('handles hierarchical account display', async () => {
    const hierarchicalData = {
      ...mockTrialBalanceData,
      accounts: [
        {
          id: 'parent-1',
          code: 'ASSETS',
          name: 'Assets',
          type: 'asset',
          level: 1,
          isGroup: true,
          debit: 5000,
          credit: 0,
          balance: 5000,
          currency: 'LYD',
          children: [
            {
              id: 'child-1',
              code: 'CASH001',
              name: 'Cash Account',
              type: 'asset',
              level: 2,
              isGroup: false,
              debit: 5000,
              credit: 0,
              balance: 5000,
              currency: 'LYD'
            }
          ]
        }
      ]
    };

    mockedApi.financialAPI.get.mockResolvedValue({
      data: {
        success: true,
        data: hierarchicalData
      }
    });

    render(<DynamicTrialBalance showHierarchy={true} />);

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    // Should show expand/collapse button for group accounts
    const expandButton = screen.getByRole('button', { name: /▶/ });
    expect(expandButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton);
    expect(screen.getByText('Cash Account')).toBeInTheDocument();
  });

  test('handles auto-refresh functionality', async () => {
    jest.useFakeTimers();
    
    render(<DynamicTrialBalance autoRefresh={true} refreshInterval={5000} />);

    await waitFor(() => {
      expect(mockedApi.financialAPI.get).toHaveBeenCalledTimes(1);
    });

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(mockedApi.financialAPI.get).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  test('handles WebSocket balance updates', async () => {
    const { useFinancialUpdates } = require('../../../hooks/useWebSocket');
    const mockOnBalanceUpdate = jest.fn();
    
    useFinancialUpdates.mockImplementation(({ onBalanceUpdate }) => {
      mockOnBalanceUpdate.mockImplementation(onBalanceUpdate);
      return { isConnected: true };
    });

    render(<DynamicTrialBalance autoRefresh={true} />);

    await waitFor(() => {
      expect(mockedApi.financialAPI.get).toHaveBeenCalledTimes(1);
    });

    // Simulate balance update
    const balanceUpdate = {
      accountId: 'account-1',
      newBalance: 6000,
      oldBalance: 5000
    };

    mockOnBalanceUpdate(balanceUpdate);

    // Should trigger another API call after delay
    await waitFor(() => {
      expect(mockedApi.financialAPI.get).toHaveBeenCalledTimes(2);
    }, { timeout: 2000 });
  });

  test('handles API errors gracefully', async () => {
    mockedApi.financialAPI.get.mockRejectedValue(new Error('API Error'));

    render(<DynamicTrialBalance />);

    // Should not crash and should show loading state
    expect(screen.getByText('جاري تحميل ميزان المراجعة...')).toBeInTheDocument();
  });

  test('displays empty state when no accounts match filters', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText('Cash Account')).toBeInTheDocument();
    });

    // Apply filter that matches no accounts
    const searchInput = screen.getByPlaceholderText('البحث في الحسابات...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentAccount' } });

    expect(screen.getByText('لا توجد حسابات')).toBeInTheDocument();
    expect(screen.getByText('لا توجد حسابات تطابق معايير البحث المحددة')).toBeInTheDocument();
  });

  test('displays last updated timestamp', async () => {
    render(<DynamicTrialBalance />);

    await waitFor(() => {
      expect(screen.getByText(/آخر تحديث:/)).toBeInTheDocument();
    });
  });
});
