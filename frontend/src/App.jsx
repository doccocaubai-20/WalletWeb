import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TopUp from './pages/TopUp';

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing, userRole } = useAuth();

  if (isInitializing) {
    return <div className="text-center mt-5">Dang tai phien dang nhap...</div>;
  }

  if (isAuthenticated && !userRole) {
    return <div className="text-center mt-5">Dang tai vai tro nguoi dung...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, isInitializing, userRole } = useAuth();

  if (isInitializing) {
    return <div className="text-center mt-5">Dang tai phien dang nhap...</div>;
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
    return <div className="text-center mt-5">Dang tai vai tro nguoi dung...</div>;
  }

  if (userRole === 'ADMIN') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return <Navigate to="/dashboard/customer" replace />;
}

function Unauthorized() {
  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-3">Khong co quyen truy cap</h2>
      <p className="text-muted mb-4">Tai khoan cua ban khong co quyen vao trang nay.</p>
      <a href="/dashboard" className="btn btn-primary-custom">Quay lai Dashboard</a>
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
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
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