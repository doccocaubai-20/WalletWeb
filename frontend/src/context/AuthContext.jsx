import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { clearStoredAvatar } from '../utils/avatar';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = Boolean(accessToken);

  const syncAuthStateFromStorage = () => {
    setAccessToken(localStorage.getItem('accessToken'));
    setRefreshToken(localStorage.getItem('refreshToken'));
    setUserRole(localStorage.getItem('userRole'));
  };

  const clearAuthState = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    clearStoredAvatar();
    setAccessToken(null);
    setRefreshToken(null);
    setUserRole(null);
    window.dispatchEvent(new Event('auth:changed'));
  };

  useEffect(() => {
    const handleAuthStorageChange = (event) => {
      if (
        !event ||
        event.type === 'auth:changed' ||
        event.key === 'accessToken' ||
        event.key === 'refreshToken' ||
        event.key === 'userRole'
      ) {
        syncAuthStateFromStorage();
      }
    };

    window.addEventListener('storage', handleAuthStorageChange);
    window.addEventListener('auth:changed', handleAuthStorageChange);

    return () => {
      window.removeEventListener('storage', handleAuthStorageChange);
      window.removeEventListener('auth:changed', handleAuthStorageChange);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken) {
        setIsInitializing(false);
        return;
      }

      if (userRole) {
        setIsInitializing(false);
        return;
      }

      try {
        const profileResponse = await api.get('/api/users/my-profile');
        const role = profileResponse.data?.role || 'CUSTOMER';
        setUserRole(role);
        localStorage.setItem('userRole', role);
        window.dispatchEvent(new Event('auth:changed'));
      } catch {
        clearAuthState();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [accessToken, userRole]);

  const login = async ({ username, password }) => {
    const response = await api.post('/api/users/login', { username, password });
    const nextAccessToken = response.data.accessToken;
    const nextRefreshToken = response.data.refreshToken;

    localStorage.setItem('accessToken', nextAccessToken);
    localStorage.setItem('refreshToken', nextRefreshToken);

    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);

    try {
      const profileResponse = await api.get('/api/users/my-profile');
      const role = profileResponse.data?.role || 'CUSTOMER';
      localStorage.setItem('userRole', role);
      setUserRole(role);
      window.dispatchEvent(new Event('auth:changed'));
      return role;
    } catch (error) {
      clearAuthState();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/users/logout');
    } catch {
      // Best-effort logout: even if server revoke fails, clear local auth state.
    } finally {
      clearAuthState();
    }
  };

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      userRole,
      isAuthenticated,
      isInitializing,
      login,
      logout,
    }),
    [accessToken, refreshToken, userRole, isAuthenticated, isInitializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
