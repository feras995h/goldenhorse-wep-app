
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LogoProvider } from './contexts/LogoContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SystemSettings from './pages/SystemSettings';
import FinancialDashboard from './pages/FinancialDashboard';
import AccountsManagement from './pages/AccountsManagement';
import JournalEntries from './pages/JournalEntries';
import CustomersManagement from './pages/CustomersManagement';
import TreasuryManagement from './pages/TreasuryManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import FixedAssetsManagement from './pages/FixedAssetsManagement';
import FinancialReports from './pages/FinancialReports';
import SalesDashboard from './pages/SalesDashboard';
import CustomerServiceDashboard from './pages/CustomerServiceDashboard';
import OperationsDashboard from './pages/OperationsDashboard';

function App() {
  return (
    <AuthProvider>
      <LogoProvider>
        <Router>
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
              <ProtectedRoute allowedRoles={['financial']}>
                <FinancialDashboard />
              </ProtectedRoute>
            } />

            <Route path="financial/accounts" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <AccountsManagement />
              </ProtectedRoute>
            } />

            <Route path="financial/journal" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <JournalEntries />
              </ProtectedRoute>
            } />

            <Route path="financial/customers" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <CustomersManagement />
              </ProtectedRoute>
            } />

            <Route path="financial/treasury" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <TreasuryManagement />
              </ProtectedRoute>
            } />

            <Route path="financial/payroll" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <EmployeeManagement />
              </ProtectedRoute>
            } />

            <Route path="financial/fixed-assets" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <FixedAssetsManagement />
              </ProtectedRoute>
            } />

            <Route path="financial/reports" element={
              <ProtectedRoute allowedRoles={['financial']}>
                <FinancialReports />
              </ProtectedRoute>
            } />
            
            <Route path="sales" element={
              <ProtectedRoute allowedRoles={['sales']}>
                <SalesDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="customer-service" element={
              <ProtectedRoute allowedRoles={['customer_service']}>
                <CustomerServiceDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="operations" element={
              <ProtectedRoute allowedRoles={['operations']}>
                <OperationsDashboard />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Router>
      </LogoProvider>
    </AuthProvider>
  );
}

export default App;
