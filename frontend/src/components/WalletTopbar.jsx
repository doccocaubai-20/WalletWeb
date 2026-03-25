import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { extractAvatarUrl, getTopbarAvatarSrc, storeAvatar } from '../utils/avatar';

const THEME_STORAGE_KEY = 'nova-theme';

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

const WalletTopbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const avatarMenuRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [topbarAvatarSrc, setTopbarAvatarSrc] = useState(() => getTopbarAvatarSrc());
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const hydrateAvatar = async () => {
      if (getTopbarAvatarSrc()) return;
      try {
        const response = await api.get('/api/users/my-profile', { params: { _ts: Date.now() } });
        storeAvatar(extractAvatarUrl(response.data));
      } catch {
        // Ignore hydration failures so topbar can still render.
      }
    };

    hydrateAvatar();

    const syncAvatar = () => setTopbarAvatarSrc(getTopbarAvatarSrc());

    window.addEventListener('avatar:changed', syncAvatar);
    window.addEventListener('auth:changed', syncAvatar);

    return () => {
      window.removeEventListener('avatar:changed', syncAvatar);
      window.removeEventListener('auth:changed', syncAvatar);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!avatarMenuRef.current) return;
      if (!avatarMenuRef.current.contains(event.target)) {
        setIsAvatarMenuOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsAvatarMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLogout = async () => {
    setIsAvatarMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
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
          <NavLink to="/dashboard/customer" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-house-door me-1"></i>Trang chủ</NavLink>
          <NavLink to="/topup" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-plus-circle me-1"></i>Nạp/Rút</NavLink>
          <NavLink to="/transfer" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-arrow-left-right me-1"></i>Chuyển tiền</NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-grid me-1"></i>Dịch vụ</NavLink>
          <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-clock-history me-1"></i>Lịch sử</NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-person me-1"></i>Hồ sơ</NavLink>
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
          <button type="button" className="wallet-icon-btn"><i className="bi bi-bell"></i></button>
          <div className="wallet-user-pill" ref={avatarMenuRef}>
            <button
              className="wallet-user-btn"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAvatarMenuOpen}
              onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
            >
              <img
                src={topbarAvatarSrc || '/images/img/userDefault.jpg'}
                alt="Avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/img/userDefault.jpg';
                }}
              />
            </button>
            {isAvatarMenuOpen && (
              <div className="wallet-avatar-menu" role="menu">
                <Link to="/profile" className="wallet-avatar-menu-item" onClick={() => setIsAvatarMenuOpen(false)}>
                  <i className="bi bi-person"></i>Hồ sơ
                </Link>
                <button type="button" className="wallet-avatar-menu-item danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i>Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className={`wallet-mobile-nav-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <aside className="wallet-mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="wallet-mobile-nav-head">
            <strong>Menu</strong>
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
            <NavLink to="/dashboard/customer" onClick={() => setIsMobileMenuOpen(false)}><i className="bi bi-house-door"></i>Trang chủ</NavLink>
            <NavLink to="/topup" onClick={() => setIsMobileMenuOpen(false)}><i className="bi bi-plus-circle"></i>Nạp/Rút</NavLink>
            <NavLink to="/transfer" onClick={() => setIsMobileMenuOpen(false)}><i className="bi bi-arrow-left-right"></i>Chuyển tiền</NavLink>
            <NavLink to="/services" onClick={() => setIsMobileMenuOpen(false)}><i className="bi bi-grid"></i>Dịch vụ</NavLink>
            <NavLink to="/transactions" onClick={() => setIsMobileMenuOpen(false)}><i className="bi bi-clock-history"></i>Lịch sử</NavLink>
            <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}><i className="bi bi-person"></i>Hồ sơ</NavLink>
            <button type="button" onClick={toggleTheme}>
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`}></i>
              {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
};

export default WalletTopbar;
