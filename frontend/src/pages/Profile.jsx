import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WalletTopbar from '../components/WalletTopbar';
import { useToast } from '../context/ToastContext';
import { appendAvatarVersion, extractAvatarUrl, getStoredAvatar, resolveAvatarSrc, storeAvatar } from '../utils/avatar';
import { parseApiErrorMessage } from '../utils/httpError';
import { validatePasswordForm, validateProfileForm } from '../utils/formValidation';
import '../css/dashboard.css';

const formatMemberSince = (createdAt) => {
  if (!createdAt) return '--';
  const dt = new Date(createdAt);
  if (Number.isNaN(dt.getTime())) return '--';
  return dt.toLocaleDateString('vi-VN');
};

const normalizeDateInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getInitials = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

const isLikelyImageFile = (file) => {
  if (!file) return false;

  const mimeType = String(file.type || '').toLowerCase();
  if (mimeType.startsWith('image/')) {
    return true;
  }

  const fileName = String(file.name || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)$/i.test(fileName);
};

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [avatarErrorMsg, setAvatarErrorMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  const [accountInfo, setAccountInfo] = useState({ accountNumber: '', balance: 0 });

  const [profileRaw, setProfileRaw] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formProfile, setFormProfile] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    address: '',
    gender: 'Khác',
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const profileMeta = useMemo(() => {
    const user = profileRaw || {};
    const people = user.people || {};
    return {
      username: user.username || '--',
      role: user.role || 'CUSTOMER',
      status: user.status || 'ACTIVE',
      phoneNumber: people.phoneNumber || '--',
      idCard: people.idCard || '--',
      memberSince: formatMemberSince(user.createdAt),
      initials: getInitials(people.fullName || formProfile.fullName),
      displayName: people.fullName || formProfile.fullName || '--',
      avatarUrl: extractAvatarUrl(user),
    };
  }, [profileRaw, formProfile.fullName]);

  useEffect(() => {
    setAvatarUrl(profileMeta.avatarUrl || '');
  }, [profileMeta.avatarUrl]);

  useEffect(() => {
    if (!isPasswordModalOpen) return;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsPasswordModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isPasswordModalOpen]);

  const handleAuthNavigation = async (error) => {
    if (error?.response?.status === 401) {
      await logout();
      navigate('/login', { replace: true });
      return true;
    }

    if (error?.response?.status === 403) {
      navigate('/unauthorized', { replace: true });
      return true;
    }

    return false;
  };

  const loadProfileData = async () => {
    setIsLoading(true);
    setProfileErrorMsg('');

    try {
      const [profileRes, accountRes] = await Promise.all([
        api.get('/api/users/my-profile', { params: { _ts: Date.now() } }),
        api.get('/api/accounts/my-account'),
      ]);

      const user = profileRes.data || {};
      const people = user.people || {};
      storeAvatar(extractAvatarUrl(user));

      setProfileRaw(user);
      setFormProfile({
        fullName: people.fullName || '',
        dateOfBirth: normalizeDateInput(people.dateOfBirth),
        email: people.email || '',
        address: people.address || '',
        gender: people.gender || 'Khác',
      });

      setAccountInfo({
        accountNumber: accountRes.data?.accountNumber || '',
        balance: Number(accountRes.data?.balance || 0),
      });
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      setProfileErrorMsg(parseApiErrorMessage(error, 'Không thể tải thông tin hồ sơ.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logout]);

  const handleProfileChange = (field, value) => {
    setFormProfile((prev) => ({ ...prev, [field]: value }));
    setProfileErrorMsg('');
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isLikelyImageFile(file)) {
      setAvatarErrorMsg('Vui lòng chọn ảnh hợp lệ (PNG, JPG, WEBP, GIF, ...).');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarErrorMsg('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.');
      event.target.value = '';
      return;
    }

    setIsSavingAvatar(true);
    setAvatarErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.put('/api/users/my-profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const successMessage = typeof response.data === 'string' ? response.data : 'Cập nhật ảnh đại diện thành công.';
      toast.success(successMessage);
      await loadProfileData();
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = parseApiErrorMessage(error, 'Cập nhật ảnh đại diện thất bại.');
      setAvatarErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSavingAvatar(false);
    }

    event.target.value = '';
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const validationMessage = validateProfileForm(formProfile);
    if (validationMessage) {
      setProfileErrorMsg(validationMessage);
      return;
    }

    setIsSavingProfile(true);
    setProfileErrorMsg('');

    try {
      const payload = {
        fullName: formProfile.fullName.trim(),
        dateOfBirth: formProfile.dateOfBirth,
        email: formProfile.email.trim(),
        address: formProfile.address.trim(),
        gender: formProfile.gender.trim(),
      };

      const response = await api.put('/api/users/my-profile', payload);
      const successMessage = typeof response.data === 'string' ? response.data : 'Cập nhật hồ sơ thành công.';
      toast.success(successMessage);
      await loadProfileData();
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = parseApiErrorMessage(error, 'Cập nhật hồ sơ thất bại.');
      setProfileErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrorMsg('');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const validationMessage = validatePasswordForm(passwordForm);
    if (validationMessage) {
      setPasswordErrorMsg(validationMessage);
      return;
    }

    setIsSavingPassword(true);
    setPasswordErrorMsg('');

    try {
      const response = await api.put('/api/users/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      const successMessage = typeof response.data === 'string' ? response.data : 'Đổi mật khẩu thành công.';
      toast.success(successMessage);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = parseApiErrorMessage(error, 'Đổi mật khẩu thất bại.');
      setPasswordErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="wallet-skeleton-wrap">
        <div className="wallet-skeleton skeleton-lg"></div>
      </div>
    );
  }

  return (
    <div className="wallet-dashboard-shell">
      <WalletTopbar />

      <main className="wallet-dashboard-body">
        <section className="wallet-profile-wrap wallet-fade-up">
          <div className="wallet-profile-head">
            <div>
              <h1>Hồ sơ cá nhân</h1>
              <p>Quản lý thông tin tài khoản và cài đặt bảo mật.</p>
            </div>
            <Link to="/dashboard/customer" className="wallet-topup-back btn btn-outline-secondary">
              <i className="bi bi-arrow-left"></i>
              Quay lại dashboard
            </Link>
          </div>

          {profileErrorMsg && <div className="alert alert-danger mb-3">{profileErrorMsg}</div>}

          <div className="wallet-profile-grid">
            <aside className="wallet-profile-summary-card">
              <div className="wallet-profile-avatar-wrap">
                {avatarUrl ? (
                  <img
                    src={appendAvatarVersion(resolveAvatarSrc(avatarUrl), getStoredAvatar().avatarVersion)}
                    alt="Avatar đại diện"
                    className="wallet-profile-avatar-image"
                    onError={() => setAvatarUrl('')}
                  />
                ) : (
                  <div className="wallet-profile-avatar">{profileMeta.initials}</div>
                )}
                <label className="wallet-profile-avatar-upload" htmlFor="avatarUploadInput">
                  <i className={`bi ${isSavingAvatar ? 'bi-hourglass-split' : 'bi-camera-fill'}`}></i>
                </label>
                <input
                  id="avatarUploadInput"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  disabled={isSavingAvatar}
                  hidden
                />
              </div>
              <h3>{profileMeta.displayName}</h3>
              <p>@{profileMeta.username}</p>
              <small className="wallet-profile-avatar-help">
                {isSavingAvatar ? 'Đang tải ảnh đại diện...' : 'Chạm biểu tượng camera để đổi ảnh đại diện'}
              </small>
              {avatarErrorMsg && <div className="wallet-profile-avatar-error">{avatarErrorMsg}</div>}

              <div className="wallet-profile-tags">
                <span className="badge text-bg-success">{profileMeta.status}</span>
                <span className="badge text-bg-primary">{profileMeta.role}</span>
              </div>

              <div className="wallet-profile-summary-list">
                <div>
                  <small>Tài khoản ví</small>
                  <strong>{accountInfo.accountNumber || '--'}</strong>
                </div>
                <div>
                  <small>Số dư hiện tại</small>
                  <strong>{Number(accountInfo.balance || 0).toLocaleString('vi-VN')} VND</strong>
                </div>
                <div>
                  <small>Thành viên từ</small>
                  <strong>{profileMeta.memberSince}</strong>
                </div>
                <div>
                  <small>Số điện thoại</small>
                  <strong>{profileMeta.phoneNumber}</strong>
                </div>
                <div>
                  <small>CCCD/CMND</small>
                  <strong>{profileMeta.idCard}</strong>
                </div>
              </div>
            </aside>

            <div className="wallet-profile-content">
              <article className="wallet-profile-card">
                <h3>Thông tin chi tiết</h3>
                <form onSubmit={handleSaveProfile}>
                  <div className="wallet-profile-form-grid">
                    <div className="wallet-profile-field">
                      <label htmlFor="profileFullName">Họ và tên</label>
                      <input
                        id="profileFullName"
                        type="text"
                        value={formProfile.fullName}
                        onChange={(e) => handleProfileChange('fullName', e.target.value)}
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div className="wallet-profile-field">
                      <label htmlFor="profileDob">Ngày sinh</label>
                      <input
                        id="profileDob"
                        type="date"
                        value={formProfile.dateOfBirth}
                        onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                      />
                    </div>

                    <div className="wallet-profile-field">
                      <label htmlFor="profileEmail">Email</label>
                      <input
                        id="profileEmail"
                        type="email"
                        value={formProfile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        placeholder="Nhập email"
                      />
                    </div>

                    <div className="wallet-profile-field">
                      <label htmlFor="profileGender">Giới tính</label>
                      <select
                        id="profileGender"
                        value={formProfile.gender}
                        onChange={(e) => handleProfileChange('gender', e.target.value)}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="wallet-profile-field full">
                      <label htmlFor="profileAddress">Địa chỉ</label>
                      <input
                        id="profileAddress"
                        type="text"
                        value={formProfile.address}
                        onChange={(e) => handleProfileChange('address', e.target.value)}
                        placeholder="Nhập địa chỉ hiện tại"
                      />
                    </div>
                  </div>

                  <div className="wallet-profile-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                      {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </article>

              <article className="wallet-profile-card">
                <h3>Bảo mật tài khoản</h3>
                {passwordErrorMsg && <div className="alert alert-danger mb-3">{passwordErrorMsg}</div>}

                <div className="wallet-profile-security-row">
                  <p>Để tăng bảo mật, hãy thay đổi mật khẩu định kỳ và không dùng lại mật khẩu cũ.</p>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => {
                      setPasswordErrorMsg('');
                      setIsPasswordModalOpen(true);
                    }}
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {isPasswordModalOpen && (
        <div className="wallet-profile-modal-backdrop" role="presentation" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="wallet-profile-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-profile-modal-head">
              <h3>Đổi mật khẩu</h3>
              <button
                type="button"
                className="wallet-profile-modal-close"
                onClick={() => setIsPasswordModalOpen(false)}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="wallet-profile-modal-body">
                {passwordErrorMsg && <div className="alert alert-danger mb-3">{passwordErrorMsg}</div>}

                <div className="wallet-profile-form-grid">
                  <div className="wallet-profile-field full">
                    <label htmlFor="oldPassword">Mật khẩu hiện tại</label>
                    <input
                      id="oldPassword"
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>

                  <div className="wallet-profile-field">
                    <label htmlFor="newPassword">Mật khẩu mới</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>

                  <div className="wallet-profile-field">
                    <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>
              </div>

              <div className="wallet-profile-modal-foot">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setIsPasswordModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSavingPassword}>
                  {isSavingPassword ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default Profile;
