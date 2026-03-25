import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import TopUp from './pages/TopUp';
import Transactions from './pages/Transactions';
import Transfer from './pages/Transfer';
import Profile from './pages/Profile';
import Services from './pages/Services';
import AdminServices from './pages/AdminServices';
import ForgotPassword from './pages/ForgotPassword';

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing, userRole } = useAuth();

  if (isInitializing) {
    return <div className="text-center mt-5">Đang tải phiên đăng nhập...</div>;
  }

  if (isAuthenticated && !userRole) {
    return <div className="text-center mt-5">Đang tải vai trò người dùng...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isInitializing, userRole } = useAuth();

  if (isInitializing) {
    return <div className="text-center mt-5">Đang tải phiên đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles.length > 0 && !userRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleBasedDashboard() {
  const { userRole } = useAuth();

  if (!userRole) {
    return <div className="text-center mt-5">Đang tải vai trò người dùng...</div>;
  }

  if (userRole === 'ADMIN') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return <Navigate to="/dashboard/customer" replace />;
}

function Unauthorized() {
  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-3">Không có quyền truy cập</h2>
      <p className="text-muted mb-4">Tài khoản của bạn không có quyền vào trang này.</p>
      <a href="/dashboard" className="btn btn-primary-custom">Quay lại Dashboard</a>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <Home />
            </PublicOnlyRoute>
          }
        />
        
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/topup"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <TopUp />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <Transfer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <Services />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/services"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminServices />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;