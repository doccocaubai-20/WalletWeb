import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

const THEME_STORAGE_KEY = 'nova-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const AdminTopbar = ({
  activeTab,
  onSelectCustomers,
  onSelectAdmins,
  onRefresh,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectCustomers = () => {
    if (onSelectCustomers) {
      onSelectCustomers();
    }
    setIsMobileMenuOpen(false);
  };

  const handleSelectAdmins = () => {
    if (onSelectAdmins) {
      onSelectAdmins();
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="wallet-topbar">
        <button
          type="button"
          className="wallet-mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Mở menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="wallet-brand">
          <div className="wallet-brand-icon">N</div>
          <span>NovaPay</span>
        </div>

        <nav className="wallet-nav-links">
          <NavLink to="/dashboard/admin" end className={({ isActive }) => (isActive || activeTab === 'home' ? 'active' : '')}>
            <i className="bi bi-house-door me-1"></i>Trang chủ
          </NavLink>

          <NavLink to="/dashboard/admin/services" className={({ isActive }) => (isActive || activeTab === 'services' ? 'active' : '')}>
            <i className="bi bi-grid me-1"></i>Dịch vụ
          </NavLink>

          {onSelectCustomers ? (
            <button type="button" className={activeTab === 'customers' ? 'active' : ''} onClick={handleSelectCustomers}>
              <i className="bi bi-people me-1"></i>Khách hàng
            </button>
          ) : (
            <NavLink to="/dashboard/admin/users?role=CUSTOMER" className={({ isActive }) => (isActive && activeTab === 'customers' ? 'active' : '')}>
              <i className="bi bi-people me-1"></i>Khách hàng
            </NavLink>
          )}

          {onSelectAdmins ? (
            <button type="button" className={activeTab === 'admins' ? 'active' : ''} onClick={handleSelectAdmins}>
              <i className="bi bi-person-badge me-1"></i>Quản trị viên
            </button>
          ) : (
            <NavLink to="/dashboard/admin/users?role=ADMIN" className={({ isActive }) => (isActive && activeTab === 'admins' ? 'active' : '')}>
              <i className="bi bi-person-badge me-1"></i>Quản trị viên
            </NavLink>
          )}
        </nav>

        <div className="wallet-top-actions">
          <button
            type="button"
            className="wallet-icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`}></i>
          </button>
          {onRefresh && (
            <button type="button" className="wallet-icon-btn" onClick={onRefresh} aria-label="Làm mới dữ liệu">
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          )}
          <button type="button" className="wallet-icon-btn"><i className="bi bi-bell"></i></button>
          <button type="button" className="wallet-btn wallet-btn-primary btn btn-primary btn-sm" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div
        className={`wallet-mobile-nav-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <aside className="wallet-mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="wallet-mobile-nav-head">
            <strong>Menu Admin</strong>
            <button
              type="button"
              className="wallet-mobile-nav-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Đóng menu"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <nav className="wallet-mobile-nav-links">
            <NavLink
              to="/dashboard/admin"
              end
              className={({ isActive }) => (isActive || activeTab === 'home' ? 'active' : '')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="bi bi-house-door"></i>Trang chủ
            </NavLink>

            <NavLink
              to="/dashboard/admin/services"
              className={({ isActive }) => (isActive || activeTab === 'services' ? 'active' : '')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <i className="bi bi-grid"></i>Dịch vụ
            </NavLink>

            {onSelectCustomers ? (
              <button type="button" className={activeTab === 'customers' ? 'active' : ''} onClick={handleSelectCustomers}>
                <i className="bi bi-people"></i>Khách hàng
              </button>
            ) : (
              <NavLink
                to="/dashboard/admin/users?role=CUSTOMER"
                className={({ isActive }) => (isActive && activeTab === 'customers' ? 'active' : '')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="bi bi-people"></i>Khách hàng
              </NavLink>
            )}

            {onSelectAdmins ? (
              <button type="button" className={activeTab === 'admins' ? 'active' : ''} onClick={handleSelectAdmins}>
                <i className="bi bi-person-badge"></i>Quản trị viên
              </button>
            ) : (
              <NavLink
                to="/dashboard/admin/users?role=ADMIN"
                className={({ isActive }) => (isActive && activeTab === 'admins' ? 'active' : '')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="bi bi-person-badge"></i>Quản trị viên
              </NavLink>
            )}

            <button type="button" onClick={toggleTheme}>
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`}></i>
              {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            </button>

            <button type="button" onClick={onLogout}>
              <i className="bi bi-box-arrow-right"></i>Đăng xuất
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
};

export default AdminTopbar;