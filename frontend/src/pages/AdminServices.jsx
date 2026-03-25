import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiErrorMessage } from '../utils/httpError';
import AdminTopbar from '../components/AdminTopbar';
import '../css/dashboard.css';

const EMPTY_FORM = {
  serviceName: '',
  category: '',
  description: '',
  price: '',
  status: 'ACTIVE',
};

const EMPTY_BANK_FORM = {
  bankName: '',
  bankCode: '',
  logoUrl: '',
};

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')} VND`;

const AdminServices = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBankSubmitting, setIsBankSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [supportedBanks, setSupportedBanks] = useState([]);
  const [bankForm, setBankForm] = useState(EMPTY_BANK_FORM);

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

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const [servicesResponse, banksResponse] = await Promise.all([
        api.get('/api/admin/service-products'),
        api.get('/api/admin/banks'),
      ]);
      setServices(servicesResponse.data || []);
      setSupportedBanks(banksResponse.data || []);
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      toast.error(parseApiErrorMessage(error, 'Không thể tải dữ liệu quản trị dịch vụ/ngân hàng.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logout]);

  const handleSelectService = (service) => {
    setSelectedServiceId(service.serviceId);
    setForm({
      serviceName: service.serviceName || '',
      category: service.category || '',
      description: service.description || '',
      price: service.price ?? '',
      status: service.status || 'ACTIVE',
    });
  };

  const handleDeleteService = async (service) => {
    if (String(service.status || '').toUpperCase() === 'INACTIVE') {
      toast.info('Dịch vụ này đã ở trạng thái INACTIVE.');
      return;
    }

    const shouldLock = window.confirm(`Khóa dịch vụ "${service.serviceName}"? Dịch vụ sẽ chuyển sang INACTIVE và ngừng bán.`);
    if (!shouldLock) return;

    try {
      await api.delete(`/api/admin/service-products/${service.serviceId}`);
      toast.success('Đã khóa dịch vụ thành công.');
      await loadServices();
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      toast.error(parseApiErrorMessage(error, 'Không thể khóa dịch vụ.'));
    }
  };

  const handleCreateNew = () => {
    setSelectedServiceId(null);
    setForm(EMPTY_FORM);
  };

  const handleAddSupportedBank = async (event) => {
    event.preventDefault();
    setIsBankSubmitting(true);

    try {
      const payload = {
        bankName: bankForm.bankName.trim(),
        bankCode: bankForm.bankCode.trim(),
        logoUrl: bankForm.logoUrl.trim() || null,
      };

      if (!payload.bankName || !payload.bankCode) {
        toast.info('Vui lòng nhập tên ngân hàng và mã ngân hàng.');
        setIsBankSubmitting(false);
        return;
      }

      await api.post('/api/admin/banks', payload);
      toast.success('Thêm ngân hàng hỗ trợ thành công.');
      setBankForm(EMPTY_BANK_FORM);
      await loadServices();
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      toast.error(parseApiErrorMessage(error, 'Không thể thêm ngân hàng hỗ trợ.'));
    } finally {
      setIsBankSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
      };

      if (!payload.serviceName.trim() || !payload.category.trim() || !Number.isFinite(payload.price) || payload.price <= 0) {
        toast.info('Vui lòng nhập đầy đủ tên, danh mục và giá hợp lệ.');
        setIsSubmitting(false);
        return;
      }

      if (selectedServiceId) {
        await api.put(`/api/admin/service-products/${selectedServiceId}`, payload);
        toast.success('Cập nhật dịch vụ thành công.');
      } else {
        await api.post('/api/admin/service-products', payload);
        toast.success('Tạo dịch vụ mới thành công.');
      }

      await loadServices();
      handleCreateNew();
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      toast.error(parseApiErrorMessage(error, 'Không thể lưu dịch vụ.'));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="wallet-dashboard-shell admin-dashboard-shell">
      <AdminTopbar
        activeTab="services"
        onRefresh={loadServices}
        onLogout={handleLogout}
      />

      <main className="wallet-dashboard-body">
        <section className="wallet-grid">
          <div className="wallet-left-col">
            <article className="wallet-history-card wallet-fade-up">
              <div className="wallet-history-head">
                <h3>Danh mục dịch vụ</h3>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleCreateNew}>Tạo mới</button>
                </div>
              </div>

              <div className="p-4 pt-0">
                {isLoading && <div className="text-center py-4">Đang tải dữ liệu...</div>}

                {!isLoading && (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tên dịch vụ</th>
                          <th>Danh mục</th>
                          <th>Giá</th>
                          <th>Trạng thái</th>
                          <th className="text-end">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-muted py-4">Chưa có dịch vụ</td>
                          </tr>
                        )}

                        {services.map((service) => (
                          <tr key={service.serviceId}>
                            <td>{service.serviceId}</td>
                            <td>{service.serviceName}</td>
                            <td>{service.category}</td>
                            <td>{formatVnd(service.price)}</td>
                            <td>
                              <span className={`badge ${service.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                {service.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleSelectService(service)}>
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteService(service)}
                                  disabled={String(service.status || '').toUpperCase() === 'INACTIVE'}
                                >
                                  {String(service.status || '').toUpperCase() === 'INACTIVE' ? 'Đã khóa' : 'Khóa'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </article>
          </div>

          <aside className="wallet-right-col">
            <article className="wallet-stats-card wallet-fade-up wallet-delay-2">
              <h4>{selectedServiceId ? 'CẬP NHẬT DỊCH VỤ' : 'TẠO DỊCH VỤ MỚI'}</h4>
              <form onSubmit={handleSubmit} className="row g-2">
                <div className="col-12">
                  <label className="form-label mb-1">Tên dịch vụ</label>
                  <input
                    className="form-control"
                    value={form.serviceName}
                    onChange={(e) => setForm((prev) => ({ ...prev, serviceName: e.target.value }))}
                    placeholder="VD: Gói Data 4G 30 ngày"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label mb-1">Danh mục</label>
                  <input
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="VD: Viễn thông"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label mb-1">Giá (VND)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label mb-1">Trạng thái</label>
                  <select
                    className="form-select"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label mb-1">Mô tả</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả ngắn về dịch vụ"
                  />
                </div>
                <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={handleCreateNew}>
                    Đặt lại
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : selectedServiceId ? 'Lưu thay đổi' : 'Tạo dịch vụ'}
                  </button>
                </div>
              </form>
            </article>

            <article className="wallet-stats-card wallet-fade-up wallet-delay-3">
              <h4>THÊM NGÂN HÀNG HỖ TRỢ</h4>
              <form onSubmit={handleAddSupportedBank} className="row g-2">
                <div className="col-12">
                  <label className="form-label mb-1">Tên ngân hàng</label>
                  <input
                    className="form-control"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    placeholder="VD: Ngân hàng TMCP Ngoại thương Việt Nam"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label mb-1">Mã ngân hàng</label>
                  <input
                    className="form-control"
                    value={bankForm.bankCode}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, bankCode: e.target.value.toUpperCase() }))}
                    placeholder="VD: VCB"
                    maxLength={10}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label mb-1">Logo URL (tuỳ chọn)</label>
                  <input
                    className="form-control"
                    value={bankForm.logoUrl}
                    onChange={(e) => setBankForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setBankForm(EMPTY_BANK_FORM)}>
                    Đặt lại
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isBankSubmitting}>
                    {isBankSubmitting ? 'Đang xử lý...' : 'Thêm ngân hàng'}
                  </button>
                </div>
              </form>

              <hr className="my-3" />

              <div className="small text-muted mb-2">Ngân hàng đang hỗ trợ: {supportedBanks.length}</div>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Mã</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportedBanks.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-muted">Chưa có ngân hàng hỗ trợ.</td>
                      </tr>
                    )}
                    {supportedBanks.map((bank) => (
                      <tr key={bank.id}>
                        <td>{bank.bankName}</td>
                        <td><span className="badge text-bg-primary">{bank.bankCode}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </aside>
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Admin workspace.</p>
        <span>Quản trị danh mục dịch vụ bán cho người dùng</span>
      </footer>
    </div>
  );
};

export default AdminServices;
