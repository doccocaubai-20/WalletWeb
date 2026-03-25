import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import WalletTopbar from '../components/WalletTopbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiErrorMessage } from '../utils/httpError';
import '../css/dashboard.css';

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')} VND`;

const Services = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();

  const [services, setServices] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [pin, setPin] = useState('');

  const selectedService = useMemo(
    () => services.find((item) => item.serviceId === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const totalAmount = useMemo(() => {
    if (!selectedService) return 0;
    return Number(selectedService.price || 0) * Number(quantity || 0);
  }, [selectedService, quantity]);

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

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const [servicesRes, accountRes] = await Promise.all([
        api.get('/api/services'),
        api.get('/api/accounts/my-account'),
      ]);

      const nextServices = servicesRes.data || [];
      setServices(nextServices);
      setWallet(accountRes.data || null);

      if (nextServices.length > 0) {
        setSelectedServiceId((current) => current ?? nextServices[0].serviceId);
      }
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;

      try {
        const [servicesRes, accountListRes] = await Promise.all([
          api.get('/api/services'),
          api.get('/api/accounts/my-accounts'),
        ]);

        const fallbackAccount = accountListRes.data?.[0] || null;
        const nextServices = servicesRes.data || [];

        setServices(nextServices);
        setWallet(fallbackAccount);

        if (nextServices.length > 0) {
          setSelectedServiceId((current) => current ?? nextServices[0].serviceId);
        }
      } catch (fallbackError) {
        const fallbackHandled = await handleAuthNavigation(fallbackError);
        if (fallbackHandled) return;
        setErrorMsg(parseApiErrorMessage(fallbackError, 'Không thể tải danh sách dịch vụ.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logout]);

  const handlePurchase = async (event) => {
    event.preventDefault();

    if (!selectedService) {
      toast.info('Vui lòng chọn dịch vụ.');
      return;
    }

    if (!wallet?.accountNumber) {
      toast.error('Không tìm thấy ví thanh toán để mua dịch vụ.');
      return;
    }

    if (!pin.trim()) {
      toast.info('Vui lòng nhập mã PIN của ví.');
      return;
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.info('Số lượng phải là số nguyên dương.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/api/services/purchase', {
        serviceId: selectedService.serviceId,
        accountNumber: wallet.accountNumber,
        quantity: qty,
        pin: pin.trim(),
      });

      const nextBalance = response.data?.balanceAfter;
      if (typeof nextBalance !== 'undefined') {
        setWallet((prev) => ({ ...(prev || {}), balance: nextBalance }));
      }

      setPin('');
      toast.success(`Mua dịch vụ thành công: ${selectedService.serviceName}`);
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      toast.error(parseApiErrorMessage(error, 'Không thể mua dịch vụ.'));
    } finally {
      setIsSubmitting(false);
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
        {errorMsg && <div className="alert alert-danger mb-3">{errorMsg}</div>}

        <section className="wallet-grid">
          <div className="wallet-left-col">
            <article className="wallet-history-card wallet-fade-up">
              <div className="wallet-history-head">
                <h3>Dịch vụ cho bạn</h3>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={loadData}>Làm mới</button>
              </div>

              <div className="p-4 pt-0">
                {services.length === 0 && (
                  <div className="text-muted">Hiện chưa có dịch vụ khả dụng.</div>
                )}

                <div className="row g-3">
                  {services.map((service) => {
                    const isSelected = selectedServiceId === service.serviceId;
                    return (
                      <div className="col-12 col-md-6" key={service.serviceId}>
                        <button
                          type="button"
                          className={`w-100 text-start border rounded-3 p-3 bg-white ${isSelected ? 'border-primary shadow-sm' : ''}`}
                          onClick={() => setSelectedServiceId(service.serviceId)}
                        >
                          <div className="d-flex justify-content-between gap-2 align-items-start">
                            <div>
                              <h5 className="mb-1">{service.serviceName}</h5>
                              <p className="mb-1 text-muted small">{service.category}</p>
                              <p className="mb-0 small">{service.description || 'Không có mô tả.'}</p>
                            </div>
                            <span className="badge text-bg-success">{formatVnd(service.price)}</span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          </div>

          <aside className="wallet-right-col">
            <article className="wallet-stats-card wallet-fade-up wallet-delay-2">
              <h4>MUA DỊCH VỤ</h4>
              <p className="mb-2 text-muted small">Ví thanh toán: {wallet?.accountNumber || 'Chưa có ví'}</p>
              <p className="mb-3">Số dư hiện tại: <strong>{formatVnd(wallet?.balance || 0)}</strong></p>

              {!selectedService && <p className="text-muted mb-0">Chọn một dịch vụ ở danh sách bên trái.</p>}

              {selectedService && (
                <form onSubmit={handlePurchase} className="row g-2">
                  <div className="col-12">
                    <input className="form-control" value={selectedService.serviceName} disabled />
                  </div>
                  <div className="col-12">
                    <label className="form-label mb-1">Số lượng</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label mb-1">Mã PIN ví</label>
                    <input
                      type="password"
                      className="form-control"
                      maxLength="6"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Nhập mã PIN"
                    />
                  </div>

                  <div className="col-12 mt-2">
                    <div className="alert alert-light border mb-0 py-2">
                      Tổng thanh toán: <strong>{formatVnd(totalAmount)}</strong>
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-between gap-2 mt-2">
                    <Link to="/transactions" className="btn btn-outline-secondary">Xem lịch sử</Link>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Đang xử lý...' : 'Mua ngay'}
                    </button>
                  </div>
                </form>
              )}
            </article>
          </aside>
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default Services;
