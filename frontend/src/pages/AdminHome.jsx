import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { parseApiErrorMessage } from '../utils/httpError';
import AdminTopbar from '../components/AdminTopbar';
import '../css/dashboard.css';

const AdminHome = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeWindow, setTimeWindow] = useState('month');
  const [overview, setOverview] = useState({
    customerTotal: 0,
    adminTotal: 0,
    serviceTotal: 0,
    activeServiceTotal: 0,
    customerRows: [],
    adminRows: [],
    serviceRows: [],
  });

  const activeServiceRate = useMemo(() => {
    if (!overview.serviceTotal) return 0;
    return Math.round((overview.activeServiceTotal / overview.serviceTotal) * 100);
  }, [overview.activeServiceTotal, overview.serviceTotal]);

  const activeUserRate = useMemo(() => {
    const total = overview.customerTotal + overview.adminTotal;
    if (!total) return 0;

    const sampledActive = [...overview.customerRows, ...overview.adminRows]
      .filter((user) => String(user.status || '').toUpperCase() === 'ACTIVE').length;
    const sampledTotal = overview.customerRows.length + overview.adminRows.length;
    if (!sampledTotal) return 0;
    return Math.round((sampledActive / sampledTotal) * 100);
  }, [overview.adminRows, overview.customerRows, overview.adminTotal, overview.customerTotal]);

  const periodLabel = useMemo(() => {
    if (timeWindow === 'day') return '24 giờ gần đây';
    if (timeWindow === 'week') return '7 ngày gần đây';
    return '30 ngày gần đây';
  }, [timeWindow]);

  const recentActivities = useMemo(() => {
    const users = [...overview.customerRows, ...overview.adminRows]
      .map((user) => ({
        id: `user-${user.userID}`,
        title: user.fullName || user.username || 'Người dùng',
        subtitle: `${user.role || 'USER'} • ${user.status || 'UNKNOWN'}`,
        tag: 'Tài khoản',
        sort: Number(user.userID || 0),
      }));

    const services = (overview.serviceRows || []).map((service) => ({
      id: `svc-${service.serviceId}`,
      title: service.serviceName,
      subtitle: `${service.category || 'Khác'} • ${String(service.status || '').toUpperCase()}`,
      tag: 'Dịch vụ',
      sort: Number(service.serviceId || 0),
    }));

    return [...users, ...services]
      .sort((a, b) => b.sort - a.sort)
      .slice(0, 8);
  }, [overview.adminRows, overview.customerRows, overview.serviceRows]);

  const warningItems = useMemo(() => {
    const inactiveServices = Math.max(overview.serviceTotal - overview.activeServiceTotal, 0);
    const inactiveUsers = [...overview.customerRows, ...overview.adminRows]
      .filter((item) => String(item.status || '').toUpperCase() !== 'ACTIVE').length;

    return [
      {
        key: 'services',
        level: inactiveServices > 0 ? 'warning' : 'ok',
        title: 'Trạng thái dịch vụ',
        detail: inactiveServices > 0
          ? `${inactiveServices} dịch vụ đang INACTIVE cần kiểm tra.`
          : 'Tất cả dịch vụ trong snapshot đang ACTIVE.',
      },
      {
        key: 'users',
        level: inactiveUsers > 0 ? 'warning' : 'ok',
        title: 'Trạng thái tài khoản',
        detail: inactiveUsers > 0
          ? `${inactiveUsers} tài khoản đang INACTIVE trong dữ liệu gần nhất.`
          : 'Không phát hiện tài khoản bất thường trong snapshot.',
      },
      {
        key: 'coverage',
        level: 'info',
        title: 'Phạm vi dữ liệu',
        detail: `Hiển thị theo ${periodLabel} (không cần thêm API mới).`,
      },
    ];
  }, [overview.activeServiceTotal, overview.adminRows, overview.customerRows, overview.serviceTotal, periodLabel]);

  const exportCsv = (fileName, header, rows) => {
    const escapeCell = (value) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportUsersCsv = () => {
    const data = [...overview.customerRows, ...overview.adminRows].map((item) => [
      item.userID,
      item.username,
      item.fullName,
      item.email,
      item.role,
      item.status,
    ]);
    exportCsv('admin-users-snapshot.csv', ['ID', 'Username', 'Ho ten', 'Email', 'Role', 'Status'], data);
  };

  const handleExportServicesCsv = () => {
    const data = overview.serviceRows.map((item) => [
      item.serviceId,
      item.serviceName,
      item.category,
      item.price,
      item.status,
    ]);
    exportCsv('admin-services-snapshot.csv', ['ID', 'Ten dich vu', 'Danh muc', 'Gia', 'Trang thai'], data);
  };

  const loadOverview = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const [customersRes, adminsRes, servicesRes] = await Promise.all([
        api.get('/api/admin/users', { params: { role: 'CUSTOMER', page: 0, size: 6 } }),
        api.get('/api/admin/users', { params: { role: 'ADMIN', page: 0, size: 6 } }),
        api.get('/api/admin/service-products'),
      ]);

      const customerTotal = Number(customersRes.data?.totalElements || 0);
      const adminTotal = Number(adminsRes.data?.totalElements || 0);
      const services = servicesRes.data || [];
      const activeServiceTotal = services.filter((item) => String(item.status || '').toUpperCase() === 'ACTIVE').length;
      const customerRows = customersRes.data?.content || [];
      const adminRows = adminsRes.data?.content || [];

      setOverview({
        customerTotal,
        adminTotal,
        serviceTotal: services.length,
        activeServiceTotal,
        customerRows,
        adminRows,
        serviceRows: services,
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      if (error?.response?.status === 403) {
        navigate('/unauthorized', { replace: true });
        return;
      }

      setErrorMsg(parseApiErrorMessage(error, 'Không thể tải dữ liệu tổng quan admin.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="wallet-dashboard-shell admin-dashboard-shell">
      <AdminTopbar activeTab="home" onRefresh={loadOverview} onLogout={handleLogout} />

      <main className="wallet-dashboard-body">
        <section className="admin-hero-card wallet-fade-up">
          <div>
            <p className="admin-hero-eyebrow">Admin Home</p>
            <h1>Trang chủ quản trị NovaPay</h1>
            <p className="admin-hero-sub">Theo dõi nhanh tình hình hệ thống và truy cập các khu vực quản trị chỉ với một lần bấm.</p>
          </div>
          <div className="admin-hero-actions">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={loadOverview}>
              Làm mới tổng quan
            </button>
            <select className="form-select form-select-sm" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}>
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
        </section>

        {errorMsg && <div className="alert alert-danger mt-3 mb-3">{errorMsg}</div>}

        <section className="admin-kpi-grid wallet-fade-up wallet-delay-2">
          <article className="admin-kpi-card">
            <small>Khách hàng</small>
            <strong>{overview.customerTotal}</strong>
            <span>Tổng tài khoản customer</span>
          </article>
          <article className="admin-kpi-card">
            <small>Quản trị viên</small>
            <strong>{overview.adminTotal}</strong>
            <span>Tổng tài khoản admin</span>
          </article>
          <article className="admin-kpi-card">
            <small>Dịch vụ</small>
            <strong>{overview.serviceTotal}</strong>
            <span>Sản phẩm dịch vụ đã cấu hình</span>
          </article>
          <article className="admin-kpi-card">
            <small>Service Active</small>
            <strong>{activeServiceRate}%</strong>
            <span>{overview.activeServiceTotal}/{overview.serviceTotal} dịch vụ đang mở bán</span>
          </article>
        </section>

        <section className="admin-home-grid wallet-fade-up wallet-delay-3">
          <article className="wallet-history-card admin-home-card">
            <div className="wallet-history-head">
              <h3>Lối tắt quản trị</h3>
            </div>
            <div className="admin-home-links">
              <Link to="/dashboard/admin/users?role=CUSTOMER" className="admin-home-link">
                <i className="bi bi-people"></i>
                <div>
                  <strong>Quản lý khách hàng</strong>
                  <small>Xem danh sách và cập nhật trạng thái customer</small>
                </div>
              </Link>
              <Link to="/dashboard/admin/users?role=ADMIN" className="admin-home-link">
                <i className="bi bi-person-badge"></i>
                <div>
                  <strong>Quản lý quản trị viên</strong>
                  <small>Kiểm soát quyền và trạng thái tài khoản admin</small>
                </div>
              </Link>
              <Link to="/dashboard/admin/services" className="admin-home-link">
                <i className="bi bi-grid"></i>
                <div>
                  <strong>Quản lý dịch vụ</strong>
                  <small>Tạo mới, cập nhật giá và trạng thái dịch vụ</small>
                </div>
              </Link>
            </div>
            <div className="admin-home-actions">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExportUsersCsv}>
                Xuất CSV User
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleExportServicesCsv}>
                Xuất CSV Dịch vụ
              </button>
            </div>
          </article>

          <article className="wallet-stats-card admin-home-card">
            <h4>GỢI Ý VẬN HÀNH</h4>
            {isLoading ? (
              <p className="text-muted mb-0">Đang tải dữ liệu tổng quan...</p>
            ) : (
              <div className="admin-home-notes">
                <p>
                  <strong>Người dùng hệ thống:</strong> {overview.customerTotal + overview.adminTotal} tài khoản.
                </p>
                <p>
                  <strong>Dịch vụ đang active:</strong> {overview.activeServiceTotal} dịch vụ.
                </p>
                <p className="mb-0">
                  Bạn có thể chuyển sang mục Khách hàng/Quản trị viên để thao tác trực tiếp.
                </p>
              </div>
            )}
          </article>
        </section>

        <section className="admin-home-grid wallet-fade-up wallet-delay-4">
          <article className="wallet-history-card admin-home-card">
            <div className="wallet-history-head">
              <h3>Hoạt động gần đây</h3>
              <span className="admin-filter-pill">{periodLabel}</span>
            </div>
            <div className="admin-activity-list">
              {recentActivities.length === 0 && <p className="text-muted mb-0">Chưa có dữ liệu hoạt động.</p>}
              {recentActivities.map((item) => (
                <div className="admin-activity-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                  <span>{item.tag}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="wallet-stats-card admin-home-card">
            <h4>CẢNH BÁO VẬN HÀNH</h4>
            <div className="admin-warning-list">
              {warningItems.map((warning) => (
                <div key={warning.key} className={`admin-warning-item ${warning.level}`}>
                  <strong>{warning.title}</strong>
                  <p>{warning.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Admin workspace.</p>
        <span>Trang chủ quản trị hệ thống</span>
      </footer>
    </div>
  );
};

export default AdminHome;