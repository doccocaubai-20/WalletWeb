import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { parseApiErrorMessage } from '../utils/httpError';
import AdminTopbar from '../components/AdminTopbar';
import '../css/dashboard.css';

const normalizeRoleFilter = (value) => (String(value || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'CUSTOMER');

const EMPTY_CREATE_FORM = {
  username: '',
  password: '',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  fullName: '',
  idCard: '',
  dateOfBirth: '',
  email: '',
  phoneNumber: '',
  address: '',
  gender: 'Nam',
};

const EMPTY_EDIT_FORM = {
  role: 'CUSTOMER',
  status: 'ACTIVE',
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
  gender: '',
  dateOfBirth: '',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleFilter, setRoleFilter] = useState(() => normalizeRoleFilter(searchParams.get('role')));
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const fetchUsers = async (nextRole = roleFilter, nextPage = page, nextKeyword = searchKeyword) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await api.get('/api/admin/users', {
        params: {
          role: nextRole,
          page: nextPage,
          size: 10,
          keyword: nextKeyword?.trim() || undefined,
        },
      });
      const content = response.data?.content || [];
      setUsers(content);
      setTotalPages(response.data?.totalPages || 1);
      setPage(response.data?.number ?? nextPage);
    } catch (error) {
      if (error.response?.status === 403) {
        navigate('/unauthorized');
        return;
      }
      setErrorMsg(parseApiErrorMessage(error, 'Không thể tải danh sách người dùng.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(roleFilter, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const queryRole = normalizeRoleFilter(searchParams.get('role'));
    if (queryRole !== roleFilter) {
      setRoleFilter(queryRole);
      fetchUsers(queryRole, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/api/admin/user', createForm);
      setSuccessMsg('Tạo người dùng thành công.');
      setCreateForm(EMPTY_CREATE_FORM);
      fetchUsers(roleFilter, 0);
    } catch (error) {
      setErrorMsg(parseApiErrorMessage(error, 'Không thể tạo người dùng mới.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role || 'CUSTOMER',
      status: user.status || 'ACTIVE',
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.put(`/api/admin/user/${editingUser.userID}`, editForm);
      setSuccessMsg('Cập nhật người dùng thành công.');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setErrorMsg(parseApiErrorMessage(error, 'Không thể cập nhật người dùng.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableUser = async (userID) => {
    const shouldDisable = window.confirm('Bạn có chắc chắn muốn khóa tài khoản này?');
    if (!shouldDisable) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/api/admin/user/${userID}`);
      setSuccessMsg('Đã khóa tài khoản thành công.');
      fetchUsers();
    } catch (error) {
      setErrorMsg(parseApiErrorMessage(error, 'Không thể khóa tài khoản.'));
    }
  };

  const changeRoleFilter = (nextRole) => {
    const normalizedRole = normalizeRoleFilter(nextRole);
    setRoleFilter(normalizedRole);
    setSearchParams({ role: normalizedRole }, { replace: true });
    setPage(0);
    fetchUsers(normalizedRole, 0, searchKeyword);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const normalizedKeyword = searchInput.trim();
    setSearchKeyword(normalizedKeyword);
    setPage(0);
    fetchUsers(roleFilter, 0, normalizedKeyword);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    setPage(0);
    fetchUsers(roleFilter, 0, '');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="wallet-dashboard-shell admin-dashboard-shell">
      <AdminTopbar
        activeTab={roleFilter === 'ADMIN' ? 'admins' : 'customers'}
        onSelectCustomers={() => changeRoleFilter('CUSTOMER')}
        onSelectAdmins={() => changeRoleFilter('ADMIN')}
        onRefresh={() => fetchUsers(roleFilter, page, searchKeyword)}
        onLogout={handleLogout}
      />

      <main className="wallet-dashboard-body">
        <section className="admin-hero-card wallet-fade-up">
          <div>
            <p className="admin-hero-eyebrow">Bảng điều khiển quản trị</p>
            <h1>Quản lý người dùng NovaPay</h1>
            <p className="admin-hero-sub">Tạo tài khoản mới, điều chỉnh quyền và kiểm soát trạng thái hoạt động trên cùng một màn hình.</p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => fetchUsers(roleFilter, 0)}>
              Làm mới dữ liệu
            </button>
            <select className="form-select form-select-sm" value={roleFilter} onChange={(e) => changeRoleFilter(e.target.value)}>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
        </section>

        {errorMsg && <div className="alert alert-danger mt-3 mb-3">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success mt-3 mb-3">{successMsg}</div>}

        <section className="wallet-grid admin-user-workspace">
          <div className="wallet-left-col">
            <article className="wallet-history-card admin-users-table-card wallet-fade-up wallet-delay-3">
              <div className="wallet-history-head">
                <h3>Danh sách người dùng</h3>
                <div className="admin-users-toolbar">
                  <span className="admin-filter-pill">Bộ lọc: {roleFilter}</span>
                  <form className="admin-users-search-form" onSubmit={handleSearchSubmit}>
                    <div className="admin-users-search-field">
                      <i className="bi bi-search admin-users-search-icon" aria-hidden="true" />
                      <input
                        type="text"
                        className="form-control form-control-sm admin-users-search"
                        placeholder="Tìm username / họ tên / email / SĐT"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary">Tìm</button>
                    {searchKeyword && (
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleClearSearch}>Xóa</button>
                    )}
                  </form>
                </div>
              </div>

              <div className="p-4 pt-0">
                {isLoading && <div className="text-center py-4">Đang tải dữ liệu...</div>}

                {!isLoading && !errorMsg && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Username</th>
                          <th>Họ tên</th>
                          <th>Email</th>
                          <th>Vai trò</th>
                          <th>Trạng thái</th>
                          <th className="text-end">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-4">Không có dữ liệu phù hợp</td>
                          </tr>
                        )}

                        {users.map((user) => (
                          <tr key={user.userID}>
                            <td>{user.userID}</td>
                            <td>{user.username}</td>
                            <td>{user.fullName}</td>
                            <td>{user.email}</td>
                            <td><span className="badge text-bg-primary">{user.role}</span></td>
                            <td>
                              <span className={`badge ${user.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleOpenEdit(user)}>Sửa</button>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDisableUser(user.userID)}>Khóa</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="text-muted small">
                        Trang {page + 1} / {Math.max(totalPages, 1)} • Hiển thị {users.length} kết quả
                        {searchKeyword && ` cho "${searchKeyword}"`}
                      </span>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fetchUsers(roleFilter, Math.max(0, page - 1), searchKeyword)} disabled={page <= 0}>Trước</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fetchUsers(roleFilter, Math.min(totalPages - 1, page + 1), searchKeyword)} disabled={page >= totalPages - 1}>Sau</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>

          <aside className="wallet-right-col">
            <article className="wallet-stats-card wallet-fade-up wallet-delay-2">
              <h4>TẠO NGƯỜI DÙNG MỚI</h4>
              <form onSubmit={handleCreateUser} className="row g-2">
                <div className="col-md-6">
                  <input className="form-control" placeholder="Username" value={createForm.username} onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))} required />
                </div>
                <div className="col-md-6">
                  <input type="password" className="form-control" placeholder="Password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} required />
                </div>
                <div className="col-12">
                  <input className="form-control" placeholder="Họ và tên" value={createForm.fullName} onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                </div>
                <div className="col-12">
                  <input className="form-control" placeholder="CCCD/CMND" value={createForm.idCard} onChange={(e) => setCreateForm((prev) => ({ ...prev, idCard: e.target.value }))} required />
                </div>
                <div className="col-6">
                  <input type="date" className="form-control" value={createForm.dateOfBirth} onChange={(e) => setCreateForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))} required />
                </div>
                <div className="col-6">
                  <select className="form-select" value={createForm.gender} onChange={(e) => setCreateForm((prev) => ({ ...prev, gender: e.target.value }))}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="col-12">
                  <input type="email" className="form-control" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} required />
                </div>
                <div className="col-12">
                  <input className="form-control" placeholder="Số điện thoại" value={createForm.phoneNumber} onChange={(e) => setCreateForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} required />
                </div>
                <div className="col-6">
                  <select className="form-select" value={createForm.role} onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="col-6">
                  <select className="form-select" value={createForm.status} onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="col-12">
                  <input className="form-control" placeholder="Địa chỉ" value={createForm.address} onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="col-12 d-flex justify-content-end mt-2">
                  <button type="submit" className="wallet-btn wallet-btn-primary btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Tạo user'}
                  </button>
                </div>
              </form>
            </article>

            <article className="wallet-stats-card wallet-fade-up wallet-delay-4">
              <h4>CẬP NHẬT NGƯỜI DÙNG</h4>
              {!editingUser && <p className="text-muted mb-0">Chọn một user trong bảng để sửa thông tin.</p>}
              {editingUser && (
                <form onSubmit={handleUpdateUser} className="row g-2">
                  <div className="col-12">
                    <input className="form-control" value={editingUser.username} disabled />
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Họ tên" value={editForm.fullName} onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <input type="email" className="form-control" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <input type="date" className="form-control" value={editForm.dateOfBirth || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <select className="form-select" value={editForm.gender || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}>
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <select className="form-select" value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}>
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <select className="form-select" value={editForm.status} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Số điện thoại" value={editForm.phoneNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Địa chỉ" value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} />
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                    <button type="submit" className="wallet-btn wallet-btn-primary btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}</button>
                  </div>
                </form>
              )}
            </article>
          </aside>
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Admin workspace.</p>
        <span>Quản trị tài khoản và phân quyền</span>
      </footer>
    </div>
  );
};

export default AdminDashboard;
