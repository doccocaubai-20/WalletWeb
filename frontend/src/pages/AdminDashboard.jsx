import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../css/dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [roleFilter, setRoleFilter] = useState('CUSTOMER');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    gender: '',
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: 'CUSTOMER',
    status: 'ACTIVE',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    gender: '',
    dateOfBirth: '',
  });

  const fetchUsers = async (nextRole = roleFilter, nextPage = page) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await api.get('/api/admin/users', {
        params: { role: nextRole, page: nextPage, size: 10 },
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
      setErrorMsg('Khong the tai danh sach nguoi dung.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/api/admin/user', createForm);
      setSuccessMsg('Tao user thanh cong.');
      setCreateForm({
        username: '',
        password: '',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        gender: '',
      });
      fetchUsers(roleFilter, 0);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Khong the tao user moi.');
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
      phoneNumber: '',
      address: '',
      gender: '',
      dateOfBirth: '',
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
      setSuccessMsg('Cap nhat user thanh cong.');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Khong the cap nhat user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableUser = async (userID) => {
    const shouldDisable = window.confirm('Ban co chac chan muon khoa tai khoan nay?');
    if (!shouldDisable) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.delete(`/api/admin/user/${userID}`);
      setSuccessMsg('Da khoa tai khoan thanh cong.');
      fetchUsers();
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Khong the khoa tai khoan.');
    }
  };

  const changeRoleFilter = (nextRole) => {
    setRoleFilter(nextRole);
    setPage(0);
    fetchUsers(nextRole, 0);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="wallet-dashboard-shell">
      <header className="wallet-topbar">
        <div className="wallet-brand">
          <div className="wallet-brand-icon">N</div>
          <span>NovaPay</span>
        </div>
        <nav className="wallet-nav-links">
          <NavLink to="/dashboard/admin" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-house-door me-1"></i>Trang chủ</NavLink>
          <button type="button" onClick={() => fetchUsers('CUSTOMER', 0)}><i className="bi bi-people me-1"></i>Khách hàng</button>
          <button type="button" onClick={() => fetchUsers('ADMIN', 0)}><i className="bi bi-person-badge me-1"></i>Quản trị viên</button>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-person me-1"></i>Hồ sơ</NavLink>
        </nav>
        <div className="wallet-top-actions">
          <button type="button" className="wallet-icon-btn" onClick={() => fetchUsers()}><i className="bi bi-arrow-clockwise"></i></button>
          <button type="button" className="wallet-icon-btn"><i className="bi bi-bell"></i></button>
          <button type="button" className="wallet-btn wallet-btn-primary" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="wallet-dashboard-body">
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <section className="wallet-grid">
          <div className="wallet-left-col">
            <article className="wallet-history-card">
              <div className="wallet-history-head">
                <h3>Tạo người dùng mới</h3>
              </div>
              <div className="p-4 pt-0">
                <form onSubmit={handleCreateUser} className="row g-2">
                  <div className="col-md-6">
                    <input className="form-control" placeholder="Username" value={createForm.username} onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <input type="password" className="form-control" placeholder="Password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <input className="form-control" placeholder="Ho ten" value={createForm.fullName} onChange={(e) => setCreateForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <input type="email" className="form-control" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <input className="form-control" placeholder="Phone" value={createForm.phoneNumber} onChange={(e) => setCreateForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
                  </div>
                  <div className="col-md-4">
                    <select className="form-select" value={createForm.role} onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}>
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select className="form-select" value={createForm.status} onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Address" value={createForm.address} onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))} />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button type="submit" className="wallet-btn wallet-btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Tạo user'}</button>
                  </div>
                </form>
              </div>
            </article>

            <article className="wallet-history-card">
              <div className="wallet-history-head">
                <h3>Danh sách user</h3>
                <select className="form-select w-auto" value={roleFilter} onChange={(e) => changeRoleFilter(e.target.value)}>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
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
                          <th>Ho ten</th>
                          <th>Email</th>
                          <th>Vai tro</th>
                          <th>Trang thai</th>
                          <th className="text-end">Thao tac</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-4">Không có dữ liệu</td>
                          </tr>
                        )}

                        {users.map((user) => (
                          <tr key={user.userID}>
                            <td>{user.userID}</td>
                            <td>{user.username}</td>
                            <td>{user.fullName}</td>
                            <td>{user.email}</td>
                            <td><span className="badge text-bg-primary">{user.role}</span></td>
                            <td>{user.status}</td>
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
                      <span className="text-muted small">Trang {page + 1} / {Math.max(totalPages, 1)}</span>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fetchUsers(roleFilter, Math.max(0, page - 1))} disabled={page <= 0}>Trước</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => fetchUsers(roleFilter, Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Sau</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>

          <aside className="wallet-right-col">
            <article className="wallet-stats-card">
              <h4>CẬP NHẬT USER</h4>
              {!editingUser && <p className="text-muted mb-0">Chọn một user trong bảng để sửa thông tin.</p>}
              {editingUser && (
                <form onSubmit={handleUpdateUser} className="row g-2">
                  <div className="col-12">
                    <input className="form-control" value={editingUser.username} disabled />
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Ho ten" value={editForm.fullName} onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <input type="email" className="form-control" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
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
                    <input className="form-control" placeholder="Phone" value={editForm.phoneNumber} onChange={(e) => setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <input className="form-control" placeholder="Address" value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} />
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                    <button type="submit" className="wallet-btn wallet-btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Lưu thay đổi'}</button>
                  </div>
                </form>
              )}
            </article>
          </aside>
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2024 NovaPay. Admin workspace.</p>
        <span>Quản trị tài khoản và phân quyền</span>
      </footer>
    </div>
  );
};

export default AdminDashboard;
