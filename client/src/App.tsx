import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import loadable from '@loadable/component';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogoProvider } from './contexts/LogoContext';
import { FinancialDataProvider } from './contexts/FinancialDataContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Lazy load components for better performance
const Dashboard = loadable(() => import('./pages/Dashboard'));
const AdminDashboard = loadable(() => import('./pages/AdminDashboard'));
const SystemSettings = loadable(() => import('./pages/SystemSettings'));
const FinancialDashboard = loadable(() => import('./pages/FinancialDashboard'));
const ChartOfAccounts = loadable(() => import('./pages/ChartOfAccounts'));
const AccountsManagement = loadable(() => import('./pages/AccountsManagement'));
const JournalEntries = loadable(() => import('./pages/JournalEntries'));
const CustomersManagement = loadable(() => import('./pages/CustomersManagement'));
const AccountStatement = loadable(() => import('./pages/AccountStatement'));
const InstantReports = loadable(() => import('./pages/InstantReports'));
const EmployeeAccountStatement = loadable(() => import('./pages/EmployeeAccountStatement'));
const EmployeeManagement = loadable(() => import('./pages/EmployeeManagement'));
const EmployeeAccountStatementNew = loadable(() => import('./pages/EmployeeAccountStatementNew'));
const EmployeePayroll = loadable(() => import('./pages/EmployeePayroll'));
const InvoiceManagement = loadable(() => import('./pages/InvoiceManagement'));
const InventoryManagement = loadable(() => import('./pages/InventoryManagement'));

// Admin redirect component
const AdminRedirect: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
};
const SalesReports = loadable(() => import('./pages/SalesReports'));
const FixedAssetsManagement = loadable(() => import('./pages/FixedAssetsManagement'));
const FinancialReports = loadable(() => import('./pages/FinancialReports'));
const OpeningBalanceEntry = loadable(() => import('./pages/OpeningBalanceEntry'));
const AccountMonitoring = loadable(() => import('./pages/AccountMonitoring'));
const InvoiceReports = loadable(() => import('./pages/InvoiceReports'));
const SalesDashboard = loadable(() => import('./pages/SalesDashboard'));
const TreasuryVouchers = loadable(() => import('./pages/TreasuryVouchers'));
const ShippingInvoices = loadable(() => import('./pages/ShippingInvoices'));
const SalesInvoices = loadable(() => import('./pages/SalesInvoices'));
const InvoiceManagementUnified = loadable(() => import('./pages/InvoiceManagementUnified'));
const ReceiptVouchers = loadable(() => import('./pages/ReceiptVouchers'));
const PaymentVouchers = loadable(() => import('./pages/PaymentVouchers'));
const AccountMappingSettings = loadable(() => import('./components/Financial/AccountMappingSettings'));
const AutoAccountCreatorPage = loadable(() => import('./pages/AutoAccountCreatorPage'));
const AdvancedProfitabilityReports = loadable(() => import('./pages/AdvancedProfitabilityReports'));
const KPIDashboard = loadable(() => import('./pages/KPIDashboard'));
const CostAnalysis = loadable(() => import('./pages/CostAnalysis'));
const BudgetPlanning = loadable(() => import('./pages/BudgetPlanning'));
const CashFlowManagement = loadable(() => import('./pages/CashFlowManagement'));

// AR Pages
const ARMatching = loadable(() => import('./pages/ARMatching'));
const ARAging = loadable(() => import('./pages/ARAging'));



function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <FinancialDataProvider>
          <Router>
            <Suspense fallback={
              <LoadingSpinner
                size="xl"
                text="جاري تحميل التطبيق..."
                fullScreen
              />
            }>
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Admin redirect */}
              <Route path="dashboard" element={<AdminRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Role-specific dashboards */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SystemSettings />
                </ProtectedRoute>
              } />

              <Route path="financial" element={
                <ProtectedRoute allowedRoles={['admin', 'financial']}>
                  <Outlet />
                </ProtectedRoute>
              }>
                <Route index element={<FinancialDashboard />} />
                <Route path="accounts" element={<ChartOfAccounts />} />
                <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
                <Route path="accounts-management" element={<AccountsManagement />} />
                <Route path="account-statement" element={<AccountStatement />} />
                <Route path="instant-reports" element={<InstantReports />} />
                <Route path="journal" element={<JournalEntries />} />
                <Route path="customers" element={<CustomersManagement />} />
                <Route path="employee-accounts" element={<EmployeeAccountStatementNew />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="fixed-assets" element={<FixedAssetsManagement />} />
                <Route path="reports" element={<FinancialReports />} />
                <Route path="ar-matching" element={<ARMatching />} />
                <Route path="ar-aging" element={<ARAging />} />

                <Route path="opening-balance" element={<OpeningBalanceEntry />} />
                <Route path="account-monitoring" element={<AccountMonitoring />} />
                <Route path="invoice-reports" element={<InvoiceReports />} />
                <Route path="employee-payroll" element={<EmployeePayroll />} />
                <Route path="profitability-reports" element={<AdvancedProfitabilityReports />} />
                <Route path="kpi-dashboard" element={<KPIDashboard />} />
                <Route path="cost-analysis" element={<CostAnalysis />} />
                <Route path="budget-planning" element={<BudgetPlanning />} />
                <Route path="cash-flow-management" element={<CashFlowManagement />} />
                <Route path="receipt-vouchers" element={<ReceiptVouchers />} />
                <Route path="payment-vouchers" element={<PaymentVouchers />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>

              <Route path="sales" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <SalesDashboard />
                </ProtectedRoute>
              } />

              <Route path="sales/customers" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <CustomersManagement />
                </ProtectedRoute>
              } />

              <Route path="sales/invoices" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <InvoiceManagementUnified />
                </ProtectedRoute>
              } />

              <Route path="sales/inventory" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <InventoryManagement />
                </ProtectedRoute>
              } />

              <Route path="sales/reports" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <SalesReports />
                </ProtectedRoute>
              } />

              <Route path="sales/warehouse-release-orders" element={
                <ProtectedRoute allowedRoles={['admin', 'financial', 'sales']}>
                  <TreasuryVouchers />
                </ProtectedRoute>
              } />

              <Route path="sales/shipping-invoices" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <ShippingInvoices />
                </ProtectedRoute>
              } />

              <Route path="sales/sales-invoices" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <SalesInvoices />
                </ProtectedRoute>
              } />

              <Route path="sales/invoice-management" element={
                <ProtectedRoute allowedRoles={['admin', 'sales']}>
                  <InvoiceManagementUnified />
                </ProtectedRoute>
              } />

              <Route path="financial/account-mapping" element={
                <ProtectedRoute allowedRoles={['admin', 'financial']}>
                  <AccountMappingSettings />
                </ProtectedRoute>
              } />

              <Route path="financial/auto-account-creator" element={
                <ProtectedRoute allowedRoles={['admin', 'financial']}>
                  <AutoAccountCreatorPage />
                </ProtectedRoute>
              } />

            </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </FinancialDataProvider>
      </LogoProvider>
    </AuthProvider>
  );
}

export default App;