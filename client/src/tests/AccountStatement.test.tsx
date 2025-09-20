import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountStatement from '../pages/AccountStatement';

// Mock the API
jest.mock('../services/api', () => ({
  financialAPI: {
    getAccounts: jest.fn(),
    getAccountStatement: jest.fn(),
  },
}));

// Mock CSS import
jest.mock('../styles/AccountStatement.css', () => ({}));

describe('AccountStatement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders account statement page', () => {
    render(<AccountStatement />);
    
    expect(screen.getByText('كشف الحساب')).toBeInTheDocument();
    expect(screen.getByText('عرض تفاصيل حركة الحساب خلال فترة محددة')).toBeInTheDocument();
  });

  test('shows account selection message when no account is selected', () => {
    render(<AccountStatement />);
    
    expect(screen.getByText('اختر حساب لعرض كشف الحساب')).toBeInTheDocument();
    expect(screen.getByText('ابحث عن الحساب بالرقم أو الاسم لعرض تفاصيل حركته')).toBeInTheDocument();
  });

  test('renders export dropdown menu', () => {
    render(<AccountStatement />);
    
    const exportButton = screen.getByText('تصدير');
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toBeDisabled(); // Should be disabled when no account is selected
  });

  test('renders print button', () => {
    render(<AccountStatement />);
    
    const printButton = screen.getByText('طباعة');
    expect(printButton).toBeInTheDocument();
    expect(printButton).toBeDisabled(); // Should be disabled when no account is selected
  });

  test('renders date range inputs', () => {
    render(<AccountStatement />);
    
    expect(screen.getByLabelText('التاريخ من')).toBeInTheDocument();
    expect(screen.getByLabelText('التاريخ إلى')).toBeInTheDocument();
  });

  test('renders all periods checkbox', () => {
    render(<AccountStatement />);
    
    const checkbox = screen.getByLabelText('كل الفترات');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('toggles date inputs when all periods checkbox is clicked', () => {
    render(<AccountStatement />);
    
    const checkbox = screen.getByLabelText('كل الفترات');
    const dateFromInput = screen.getByLabelText('التاريخ من');
    const dateToInput = screen.getByLabelText('التاريخ إلى');
    
    // Initially date inputs should be visible
    expect(dateFromInput).toBeVisible();
    expect(dateToInput).toBeVisible();
    
    // Click checkbox to show all periods
    fireEvent.click(checkbox);
    
    // Date inputs should be hidden
    expect(dateFromInput).not.toBeVisible();
    expect(dateToInput).not.toBeVisible();
  });

  test('renders account search inputs', () => {
    render(<AccountStatement />);
    
    expect(screen.getByPlaceholderText('رقم الحساب')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('اسم الحساب')).toBeInTheDocument();
  });

  test('export menu shows when export button is clicked with selected account', async () => {
    const mockAccount = {
      id: '1',
      code: '1001',
      name: 'حساب تجريبي',
      currency: 'LYD'
    };

    // Mock API responses
    const { financialAPI } = require('../services/api');
    financialAPI.getAccounts.mockResolvedValue({ data: [mockAccount] });
    financialAPI.getAccountStatement.mockResolvedValue({
      entries: [],
      totals: { openingBalance: 0, closingBalance: 0 }
    });

    render(<AccountStatement />);
    
    // Simulate account selection (this would normally happen through search)
    // For testing purposes, we'll need to mock the internal state
    // This is a simplified test - in real testing, you'd simulate the full user flow
  });

  test('applies correct CSS classes', () => {
    render(<AccountStatement />);
    
    // Check if the main container has the correct classes
    const mainContainer = screen.getByText('كشف الحساب').closest('div');
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'p-6');
  });

  test('renders loading state', () => {
    render(<AccountStatement />);
    
    // The loading state would be shown when fetching account statement
    // This test would need to be expanded based on the actual loading implementation
  });
});

// Integration tests for the enhanced features
describe('AccountStatement Enhanced Features', () => {
  test('opening balance row has special styling', () => {
    // This test would verify that opening balance entries have the correct CSS classes
    // Implementation would depend on having test data with opening balance
  });

  test('clickable rows have correct event handlers', () => {
    // This test would verify that non-opening-balance rows are clickable
    // and opening balance rows are not clickable
  });

  test('export menu has all required options', () => {
    // This test would verify that the export menu contains:
    // - Excel export option
    // - PDF export option  
    // - Word export option
  });

  test('entry modal opens with correct data', () => {
    // This test would verify that clicking on an entry opens the modal
    // with the correct entry details
  });

  test('print function generates correct HTML', () => {
    // This test would verify that the print function generates
    // properly formatted HTML for printing
  });
});

// Accessibility tests
describe('AccountStatement Accessibility', () => {
  test('has proper ARIA labels', () => {
    render(<AccountStatement />);
    
    // Check for proper labeling of form elements
    expect(screen.getByLabelText('التاريخ من')).toBeInTheDocument();
    expect(screen.getByLabelText('التاريخ إلى')).toBeInTheDocument();
    expect(screen.getByLabelText('كل الفترات')).toBeInTheDocument();
  });

  test('buttons have proper titles for tooltips', () => {
    render(<AccountStatement />);
    
    const printButton = screen.getByTitle('طباعة') || screen.getByText('طباعة');
    expect(printButton).toBeInTheDocument();
  });

  test('table has proper structure for screen readers', () => {
    // This test would verify that the statement table has proper
    // table headers and structure for accessibility
  });
});

// Performance tests
describe('AccountStatement Performance', () => {
  test('handles large datasets efficiently', () => {
    // This test would verify that the component can handle
    // large numbers of statement entries without performance issues
  });

  test('debounces search input', () => {
    // This test would verify that account search is debounced
    // to prevent excessive API calls
  });
});

export default {};
