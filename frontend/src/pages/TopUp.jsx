import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../css/dashboard.css';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const sanitizeAmount = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

const TopUp = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();

  const [method, setMethod] = useState('linked');
  const [amountInput, setAmountInput] = useState('200000');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const amount = useMemo(() => sanitizeAmount(amountInput), [amountInput]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const loadTopupData = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const [accountResponse, banksResponse] = await Promise.all([
        api.get('/api/accounts/my-account'),
        api.get('/api/banks/linked'),
      ]);

      const account = accountResponse.data;
      const banks = banksResponse.data || [];

      setAccountNumber(account?.accountNumber || '');
      setBalance(Number(account?.balance || 0));
      setLinkedBanks(banks);

      if (banks.length > 0) {
        setSelectedBankId(banks[0].id);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      if (error.response?.status === 403) {
        navigate('/unauthorized', { replace: true });
        return;
      }

      setErrorMsg('Không thể tải dữ liệu nạp tiền. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTopupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logout]);

  useEffect(() => {
    const vnpayStatus = searchParams.get('vnpayStatus');
    if (!vnpayStatus) {
      return;
    }

    const message = searchParams.get('message');
    const amountFromCallback = Number(searchParams.get('amount') || 0);
    setMethod('vnpay');
    setErrorMsg('');
    setSuccessMsg('');

    if (vnpayStatus === 'success') {
      setSuccessMsg(message || `Nạp tiền VNPAY thành công: ${formatVnd(amountFromCallback)}`);
      loadTopupData();
    } else {
      setErrorMsg(message || 'Giao dịch VNPAY thất bại hoặc đã bị hủy.');
    }

    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  const handleTopupByLinkedBank = async () => {
    if (!selectedBankId) {
      setErrorMsg('Vui lòng chọn ngân hàng liên kết.');
      return;
    }

    if (!accountNumber) {
      setErrorMsg('Không tìm thấy tài khoản ví để nạp tiền.');
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMsg('Số tiền nạp phải lớn hơn 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/api/wallet/topup', {
        accountNumber,
        linkedBankId: selectedBankId,
        amount,
        description: 'Nạp tiền ngân hàng liên kết',
      });

      setSuccessMsg(`Nạp tiền thành công. Mã GD: ${response.data?.transactionCode || '---'}`);
      setBalance(Number(response.data?.balanceAfter || balance));
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      setErrorMsg(error.response?.data?.message || error.response?.data || 'Nạp tiền thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopupByVNPay = async () => {
    if (!amount || amount <= 0) {
      setErrorMsg('Số tiền nạp phải lớn hơn 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.get('/api/vnpay/create-payment', {
        params: {
          amount,
          accountNumber,
        },
      });

      if (typeof response.data === 'string' && response.data.startsWith('http')) {
        window.location.href = response.data;
        return;
      }

      setErrorMsg('Không tạo được liên kết thanh toán VNPAY.');
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      setErrorMsg('Khởi tạo thanh toán VNPAY thất bại.');
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
      <header className="wallet-topbar">
        <div className="wallet-brand">
          <div className="wallet-brand-icon">N</div>
          <span>NovaPay</span>
        </div>
        <nav className="wallet-nav-links">
          <NavLink to="/dashboard/customer" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-house-door me-1"></i>Trang chủ</NavLink>
          <NavLink to="/topup" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-plus-circle me-1"></i>Nạp tiền</NavLink>
          <NavLink to="/transfer" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-arrow-left-right me-1"></i>Chuyển tiền</NavLink>
          <button type="button"><i className="bi bi-clock-history me-1"></i>Lịch sử</button>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}><i className="bi bi-person me-1"></i>Hồ sơ</NavLink>
        </nav>
        <div className="wallet-top-actions">
          <button type="button" className="wallet-icon-btn"><i className="bi bi-bell"></i></button>
          <button type="button" className="wallet-logout-top-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="wallet-dashboard-body">
        <section className="wallet-topup-wrap wallet-fade-up">
          <div className="wallet-topup-head">
            <div>
              <h1>Nạp tiền</h1>
              <p>Số dư hiện tại: <strong>{formatVnd(balance)}</strong></p>
            </div>
            <Link to="/dashboard/customer" className="wallet-topup-back">
              <i className="bi bi-arrow-left"></i>
              Quay lại dashboard
            </Link>
          </div>

          {errorMsg && <div className="alert alert-danger mt-3 mb-3">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success mt-3 mb-3">{successMsg}</div>}

          <div className="wallet-topup-card">
            <h3>Nhập số tiền cần nạp</h3>
            <div className="wallet-topup-amount-box">
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0"
              />
              <span>VND</span>
            </div>

            <div className="wallet-topup-quick-list">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={amount === value ? 'active' : ''}
                  onClick={() => setAmountInput(String(value))}
                >
                  {formatVnd(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="wallet-topup-methods">
            <button
              type="button"
              className={method === 'linked' ? 'active' : ''}
              onClick={() => setMethod('linked')}
            >
              Nạp tiền ngân hàng liên kết
            </button>
            <button
              type="button"
              className={method === 'vnpay' ? 'active' : ''}
              onClick={() => setMethod('vnpay')}
            >
              Nạp tiền qua VNPAY
            </button>
          </div>

          {method === 'linked' && (
            <div className="wallet-topup-card wallet-fade-up wallet-delay-1">
              <div className="wallet-topup-bank-head">
                <h3>Chọn ngân hàng liên kết</h3>
                <small>{linkedBanks.length} ngân hàng khả dụng</small>
              </div>

              {linkedBanks.length === 0 && (
                <div className="wallet-topup-empty">Bạn chưa liên kết ngân hàng. Vui lòng liên kết trước khi nạp tiền.</div>
              )}

              {linkedBanks.length > 0 && (
                <div className="wallet-linked-bank-grid">
                  {linkedBanks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      className={`wallet-linked-bank-item ${selectedBankId === bank.id ? 'active' : ''}`}
                      onClick={() => setSelectedBankId(bank.id)}
                    >
                      <span className="bank-name">{bank.bankName}</span>
                      <small>{bank.maskedAccountNumber}</small>
                    </button>
                  ))}
                </div>
              )}

              <div className="wallet-topup-submit-row">
                <button
                  type="button"
                  className="wallet-btn wallet-btn-primary"
                  onClick={handleTopupByLinkedBank}
                  disabled={isSubmitting || linkedBanks.length === 0}
                >
                  {isSubmitting ? 'Đang xử lý...' : `Nạp ${formatVnd(amount)}`}
                </button>
              </div>
            </div>
          )}

          {method === 'vnpay' && (
            <div className="wallet-topup-card wallet-fade-up wallet-delay-1">
              <h3>Thanh toán qua VNPAY</h3>
              <p className="wallet-topup-note">Bạn sẽ được chuyển hướng đến cổng thanh toán VNPAY an toàn để hoàn tất giao dịch.</p>

              <div className="wallet-topup-submit-row">
                <button
                  type="button"
                  className="wallet-btn wallet-btn-primary"
                  onClick={handleTopupByVNPay}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang chuyển hướng...' : `Tiếp tục với VNPAY (${formatVnd(amount)})`}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2024 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default TopUp;
