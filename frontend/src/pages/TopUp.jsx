import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import WalletTopbar from '../components/WalletTopbar';
import { parseApiErrorMessage } from '../utils/httpError';
import {
  validateLinkedBankRequest,
  validateTopupRequest,
  validateWithdrawRequest,
} from '../utils/formValidation';
import '../css/dashboard.css';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const sanitizeAmount = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

const normalizeWithdrawError = (message) => {
  const normalized = String(message || '').toUpperCase();
  if (normalized.includes('INVALID_PIN')) {
    return 'Mã PIN không đúng. Vui lòng kiểm tra lại.';
  }
  if (normalized.includes('INSUFFICIENT_BALANCE')) {
    return 'Số dư không đủ để thực hiện rút tiền.';
  }
  return message;
};

const TopUp = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();
  const toast = useToast();

  const [method, setMethod] = useState('linked');
  const [amountInput, setAmountInput] = useState('200000');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [supportedBanks, setSupportedBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [withdrawPin, setWithdrawPin] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [linkBankId, setLinkBankId] = useState('');
  const [linkBankAccountInput, setLinkBankAccountInput] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const amount = useMemo(() => sanitizeAmount(amountInput), [amountInput]);
  const isAmountFlow = method === 'linked' || method === 'vnpay' || method === 'withdraw';
  const headerTitle = useMemo(() => {
    if (method === 'withdraw') return 'Rút tiền';
    if (method === 'link-bank') return 'Thêm ngân hàng liên kết';
    if (method === 'vnpay') return 'Nạp tiền qua VNPAY';
    return 'Nạp tiền';
  }, [method]);

  const clearMessages = useCallback(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, []);

  const switchMethod = useCallback((nextMethod) => {
    setMethod(nextMethod);
    clearMessages();
  }, [clearMessages]);

  const loadTopupData = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) {
      setIsLoading(true);
    }
    setErrorMsg('');

    try {
      const [accountResponse, banksResponse, supportedBanksResponse] = await Promise.all([
        api.get('/api/accounts/my-account'),
        api.get('/api/banks/linked'),
        api.get('/api/banks'),
      ]);

      const account = accountResponse.data;
      const banks = banksResponse.data || [];
      const supported = supportedBanksResponse.data || [];

      setAccountNumber(account?.accountNumber || '');
      setBalance(Number(account?.balance || 0));
      setLinkedBanks(banks);
      setSupportedBanks(supported);

      setSelectedBankId((current) => {
        if (banks.length === 0) return null;
        if (current && banks.some((bank) => bank.id === current)) return current;
        return banks[0].id;
      });

      setLinkBankId((current) => {
        if (current && supported.some((bank) => String(bank.id) === String(current))) return current;
        return supported[0] ? String(supported[0].id) : '';
      });
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
      toast.error('Không thể tải dữ liệu nạp tiền. Vui lòng thử lại.');
    } finally {
      if (showSkeleton) {
        setIsLoading(false);
      }
    }
  }, [logout, navigate, toast]);

  useEffect(() => {
    loadTopupData();
  }, [loadTopupData]);

  useEffect(() => {
    const vnpayStatus = searchParams.get('vnpayStatus');
    if (!vnpayStatus) {
      return;
    }

    const message = searchParams.get('message');
    const amountFromCallback = Number(searchParams.get('amount') || 0);
    const txnRef = String(searchParams.get('txnRef') || '').trim();
    const callbackKey = txnRef
      ? `vnpay-callback-${txnRef}`
      : `vnpay-callback-${vnpayStatus}-${amountFromCallback}-${message || ''}`;

    if (sessionStorage.getItem(callbackKey) === '1') {
      setSearchParams({}, { replace: true });
      return;
    }

    sessionStorage.setItem(callbackKey, '1');
    setMethod('vnpay');
    clearMessages();

    if (vnpayStatus === 'success') {
      const successMessage = message || `Nạp tiền VNPAY thành công: ${formatVnd(amountFromCallback)}`;
      setSuccessMsg(successMessage);
      toast.success(successMessage);
      loadTopupData(false);
    } else {
      const failedMessage = message || 'Giao dịch VNPAY thất bại hoặc đã bị hủy.';
      setErrorMsg(failedMessage);
      toast.error(failedMessage);
    }

    setSearchParams({}, { replace: true });
  }, [clearMessages, loadTopupData, searchParams, setSearchParams, toast]);

  const handleTopupByLinkedBank = async () => {
    const validationMessage = validateTopupRequest({
      selectedBankId,
      accountNumber,
      amount,
      requireLinkedBank: true,
    });
    if (validationMessage) {
      setErrorMsg(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await api.post('/api/wallet/topup', {
        accountNumber,
        linkedBankId: selectedBankId,
        amount,
        description: 'Nạp tiền ngân hàng liên kết',
      });

      const successMessage = `Nạp tiền thành công. Mã GD: ${response.data?.transactionCode || '---'}`;
      setSuccessMsg(successMessage);
      toast.success(successMessage);
      setBalance(Number(response.data?.balanceAfter || balance));
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      const message = parseApiErrorMessage(error, 'Nạp tiền thất bại.');
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopupByVNPay = async () => {
    const validationMessage = validateTopupRequest({
      selectedBankId,
      accountNumber,
      amount,
      requireLinkedBank: false,
    });
    if (validationMessage) {
      setErrorMsg(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setIsSubmitting(true);
    clearMessages();

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

      const message = 'Không tạo được liên kết thanh toán VNPAY.';
      setErrorMsg(message);
      toast.error(message);
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      const message = parseApiErrorMessage(error, 'Khởi tạo thanh toán VNPAY thất bại.');
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawByLinkedBank = async () => {
    const validationMessage = validateWithdrawRequest({
      selectedBankId,
      accountNumber,
      amount,
      pin: withdrawPin,
    });
    if (validationMessage) {
      setErrorMsg(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await api.post('/api/wallet/withdraw', {
        accountNumber,
        linkedBankId: selectedBankId,
        amount,
        pin: withdrawPin,
        description: withdrawDescription.trim() || 'Rút tiền về ngân hàng liên kết',
      });

      const successMessage = `Rút tiền thành công. Mã GD: ${response.data?.transactionCode || '---'}`;
      setSuccessMsg(successMessage);
      toast.success(successMessage);
      setBalance(Number(response.data?.balanceAfter || balance));
      setWithdrawPin('');
      setWithdrawDescription('');
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      const baseMessage = parseApiErrorMessage(error, 'Rút tiền thất bại.');
      const message = normalizeWithdrawError(baseMessage);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkBank = async () => {
    const validationMessage = validateLinkedBankRequest({
      bankId: linkBankId,
      bankAccountNumber: linkBankAccountInput,
    });
    if (validationMessage) {
      setErrorMsg(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await api.post('/api/banks/link', {
        bankId: Number(linkBankId),
        accountNumber: linkBankAccountInput.trim(),
      });

      setSuccessMsg('Liên kết ngân hàng thành công. Bạn có thể nạp/rút ngay bây giờ.');
      toast.success('Liên kết ngân hàng thành công.');
      setMethod('linked');
      setSelectedBankId(response.data?.id ?? null);
      setLinkBankAccountInput('');
      await loadTopupData(false);
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      const message = parseApiErrorMessage(error, 'Liên kết ngân hàng thất bại.');
      setErrorMsg(message);
      toast.error(message);
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
        {successMsg && <div className="alert alert-success mb-3">{successMsg}</div>}

        <section className="wallet-topup-wrap wallet-transfer-wrap wallet-fade-up">
          <div className="wallet-transfer-hero">
            <div className="wallet-transfer-head">
              <div className="wallet-transfer-head-content">
                <h1>{headerTitle}</h1>
                <div className="wallet-transfer-head-meta">
                  <p>Tài khoản nguồn: <strong>{accountNumber || '---'}</strong></p>
                  <p>Số dư khả dụng: <strong>{formatVnd(balance)}</strong></p>
                </div>
              </div>
              <Link to="/dashboard/customer" className="wallet-topup-back btn btn-outline-secondary">
                <i className="bi bi-arrow-left"></i>
                Quay lại dashboard
              </Link>
            </div>
          </div>

          {isAmountFlow && (
            <div className="wallet-topup-card">
              <h3>{method === 'withdraw' ? 'Nhập số tiền cần rút' : 'Nhập số tiền cần nạp'}</h3>
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
          )}

          <div className="wallet-topup-methods">
            <button
              type="button"
              className={method === 'linked' ? 'active' : ''}
              onClick={() => switchMethod('linked')}
            >
              Nạp tiền ngân hàng
            </button>
            <button
              type="button"
              className={method === 'vnpay' ? 'active' : ''}
              onClick={() => switchMethod('vnpay')}
            >
              Nạp tiền qua VNPAY
            </button>
            <button
              type="button"
              className={method === 'withdraw' ? 'active' : ''}
              onClick={() => switchMethod('withdraw')}
            >
              Rút tiền
            </button>
            <button
              type="button"
              className={method === 'link-bank' ? 'active' : ''}
              onClick={() => switchMethod('link-bank')}
            >
              Thêm ngân hàng liên kết
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
                  className="wallet-btn wallet-btn-primary btn btn-primary"
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
                  className="wallet-btn wallet-btn-primary btn btn-primary"
                  onClick={handleTopupByVNPay}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang chuyển hướng...' : `Tiếp tục với VNPAY (${formatVnd(amount)})`}
                </button>
              </div>
            </div>
          )}

          {method === 'withdraw' && (
            <div className="wallet-topup-card wallet-fade-up wallet-delay-1">
              <div className="wallet-topup-bank-head">
                <h3>Rút tiền về ngân hàng liên kết</h3>
                <small>{linkedBanks.length} ngân hàng khả dụng</small>
              </div>

              {linkedBanks.length === 0 && (
                <div className="wallet-topup-empty">Bạn chưa liên kết ngân hàng. Vui lòng thêm ngân hàng trước khi rút tiền.</div>
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

              <div className="wallet-topup-inline-form">
                <div className="wallet-topup-field">
                  <label htmlFor="withdrawDescription">Nội dung rút tiền</label>
                  <input
                    id="withdrawDescription"
                    type="text"
                    value={withdrawDescription}
                    onChange={(e) => setWithdrawDescription(e.target.value)}
                    placeholder="Ví dụ: Rút tiền chi tiêu cá nhân"
                  />
                </div>

                <div className="wallet-topup-field">
                  <label htmlFor="withdrawPin">Mã PIN</label>
                  <input
                    id="withdrawPin"
                    type="password"
                    value={withdrawPin}
                    onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="wallet-topup-submit-row">
                <button
                  type="button"
                  className="wallet-btn wallet-btn-primary btn btn-primary"
                  onClick={handleWithdrawByLinkedBank}
                  disabled={isSubmitting || linkedBanks.length === 0}
                >
                  {isSubmitting ? 'Đang xử lý...' : `Rút ${formatVnd(amount)}`}
                </button>
              </div>
            </div>
          )}

          {method === 'link-bank' && (
            <div className="wallet-topup-card wallet-fade-up wallet-delay-1">
              <div className="wallet-topup-bank-head">
                <h3>Thêm ngân hàng liên kết</h3>
                <small>{supportedBanks.length} ngân hàng hỗ trợ</small>
              </div>

              {supportedBanks.length === 0 && (
                <div className="wallet-topup-empty">Hiện chưa có ngân hàng hỗ trợ. Vui lòng thử lại sau.</div>
              )}

              {supportedBanks.length > 0 && (
                <div className="wallet-supported-bank-grid">
                  {supportedBanks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      className={`wallet-linked-bank-item ${String(linkBankId) === String(bank.id) ? 'active' : ''}`}
                      onClick={() => setLinkBankId(String(bank.id))}
                    >
                      <span className="bank-name">{bank.bankName}</span>
                      <small>{bank.bankCode}</small>
                    </button>
                  ))}
                </div>
              )}

              <div className="wallet-topup-inline-form">
                <div className="wallet-topup-field full">
                  <label htmlFor="linkBankAccount">Số tài khoản ngân hàng</label>
                  <input
                    id="linkBankAccount"
                    type="text"
                    value={linkBankAccountInput}
                    onChange={(e) => setLinkBankAccountInput(e.target.value.replace(/\s+/g, '').slice(0, 30))}
                    placeholder="Nhập số tài khoản ngân hàng cần liên kết"
                  />
                </div>
              </div>

              <div className="wallet-topup-submit-row">
                <button
                  type="button"
                  className="wallet-btn wallet-btn-primary btn btn-primary"
                  onClick={handleLinkBank}
                  disabled={isSubmitting || supportedBanks.length === 0}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Liên kết ngân hàng'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default TopUp;
