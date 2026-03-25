import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WalletTopbar from '../components/WalletTopbar';
import { useToast } from '../context/ToastContext';
import { parseApiErrorMessage } from '../utils/httpError';
import { validateTransferPin, validateTransferRequest } from '../utils/formValidation';
import '../css/dashboard.css';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const sanitizeAmount = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

const resolveReceiverName = (data) => {
  if (typeof data === 'string') {
    return data;
  }

  if (data && typeof data === 'object') {
    return (
      data.receiverName ||
      data.accountName ||
      data.fullName ||
      data.name ||
      data.userFullName ||
      ''
    );
  }

  return '';
};

const Transfer = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [senderAccountNumber, setSenderAccountNumber] = useState('');
  const [senderBalance, setSenderBalance] = useState(0);
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverLookupState, setReceiverLookupState] = useState('idle');
  const [receiverLookupError, setReceiverLookupError] = useState('');
  const [amountInput, setAmountInput] = useState('100000');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalError, setPinModalError] = useState('');
  const [transferTypeId, setTransferTypeId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const receiverLookupRequestIdRef = useRef(0);

  const amount = useMemo(() => sanitizeAmount(amountInput), [amountInput]);

  useEffect(() => {
    if (!isPinModalOpen) return;

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsPinModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isPinModalOpen]);

  const loadTransferData = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const [accountRes, typesRes] = await Promise.all([
        api.get('/api/accounts/my-account'),
        api.get('/api/transaction-types'),
      ]);

      const account = accountRes.data;
      setSenderAccountNumber(account?.accountNumber || '');
      setSenderBalance(Number(account?.balance || 0));

      const types = Array.isArray(typesRes.data) ? typesRes.data : [];
      const transferType = types.find((t) => {
        const name = String(t?.typeName || '').toLowerCase();
        const desc = String(t?.description || '').toLowerCase();
        return name.includes('transfer') || name.includes('chuyen') || desc.includes('transfer') || desc.includes('chuyen');
      });

      setTransferTypeId(transferType?.typeID ?? types[0]?.typeID ?? 1);
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

      setErrorMsg('Không thể tải dữ liệu chuyển tiền. Vui lòng thử lại.');
      toast.error('Không thể tải dữ liệu chuyển tiền. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransferData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, logout]);

  const verifyReceiverAccount = async (accountNumber) => {
    const normalizedAccount = String(accountNumber || '').trim();

    if (!normalizedAccount) {
      setReceiverLookupState('idle');
      setReceiverLookupError('');
      setReceiverName('');
      return false;
    }

    if (normalizedAccount === senderAccountNumber) {
      setReceiverLookupState('error');
      setReceiverLookupError('Không thể chuyển tiền cho chính tài khoản của bạn.');
      setReceiverName('');
      return false;
    }

    const requestId = receiverLookupRequestIdRef.current + 1;
    receiverLookupRequestIdRef.current = requestId;
    setReceiverLookupState('loading');
    setReceiverLookupError('');

    try {
      const response = await api.get(`/api/accounts/${encodeURIComponent(normalizedAccount)}/verify`);
      if (requestId !== receiverLookupRequestIdRef.current) {
        return false;
      }

      const resolvedName = resolveReceiverName(response.data);
      if (!resolvedName) {
        setReceiverLookupState('error');
        setReceiverLookupError('Không xác định được tên người nhận.');
        setReceiverName('');
        return false;
      }

      setReceiverLookupState('verified');
      setReceiverLookupError('');
      setReceiverName(resolvedName);
      return true;
    } catch (error) {
      if (requestId !== receiverLookupRequestIdRef.current) {
        return false;
      }

      setReceiverLookupState('error');
      setReceiverLookupError(parseApiErrorMessage(error, 'Không tìm thấy tài khoản nhận.'));
      setReceiverName('');
      return false;
    }
  };

  useEffect(() => {
    const normalizedAccount = receiverAccountNumber.trim();

    if (!normalizedAccount) {
      setReceiverLookupState('idle');
      setReceiverLookupError('');
      setReceiverName('');
      return undefined;
    }

    if (normalizedAccount.length < 6) {
      setReceiverLookupState('idle');
      setReceiverLookupError('');
      setReceiverName('');
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      verifyReceiverAccount(normalizedAccount);
    }, 400);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverAccountNumber, senderAccountNumber]);

  const handleOpenPinModal = async () => {
    const validationMessage = validateTransferRequest({
      senderAccountNumber,
      receiverAccountNumber,
      amount,
      senderBalance,
      transferTypeId,
      receiverLookupState,
    });
    if (validationMessage) {
      setErrorMsg(validationMessage);
      if (receiverLookupState === 'loading') {
        toast.info(validationMessage);
      } else {
        toast.error(validationMessage);
      }
      return;
    }

    let verified = receiverLookupState === 'verified';
    if (!verified) {
      verified = await verifyReceiverAccount(receiverAccountNumber);
    }

    if (!verified) {
      setErrorMsg('Vui lòng kiểm tra lại tài khoản nhận trước khi tiếp tục.');
      toast.error('Vui lòng kiểm tra lại tài khoản nhận trước khi tiếp tục.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setPin('');
    setPinModalError('');
    setIsPinModalOpen(true);
  };

  const handleSubmitTransfer = async () => {
    const pinMessage = validateTransferPin(pin);
    if (pinMessage) {
      setPinModalError(pinMessage);
      return;
    }

    setIsSubmitting(true);
    setPinModalError('');

    try {
      const payload = {
        senderAccountNumber,
        receiverAccountNumber: receiverAccountNumber.trim(),
        amount,
        description: description.trim(),
        pin,
        transactionTypeId: transferTypeId,
      };

      const response = await api.post('/api/transactions/transfer', payload);
      setIsPinModalOpen(false);
      const successMessage = typeof response.data === 'string' ? response.data : 'Chuyển tiền thành công.';
      setSuccessMsg(successMessage);
      toast.success(successMessage);
      setPin('');
      setDescription('');
      setReceiverAccountNumber('');
      setReceiverName('');
      setReceiverLookupState('idle');
      setReceiverLookupError('');
      setAmountInput('100000');
      await loadTransferData();
    } catch (error) {
      const message = parseApiErrorMessage(error, 'Chuyển tiền thất bại.');
      setPinModalError(message);
      toast.error(message);
      setErrorMsg('');
      setSuccessMsg('');
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

        <section className="wallet-transfer-wrap wallet-fade-up">
          <div className="wallet-transfer-hero">
            <div className="wallet-transfer-head">
              <div className="wallet-transfer-head-content">
                <h1>Chuyển tiền nội bộ</h1>
                <div className="wallet-transfer-head-meta">
                  <p>Tài khoản nguồn: <strong>{senderAccountNumber || '---'}</strong></p>
                  <p>Số dư khả dụng: <strong>{formatVnd(senderBalance)}</strong></p>
                </div>
              </div>
              <Link to="/dashboard/customer" className="wallet-topup-back btn btn-outline-secondary">
                <i className="bi bi-arrow-left"></i>
                Quay lại dashboard
              </Link>
            </div>
          </div>

          <div className="wallet-transfer-layout">
            <article className="wallet-transfer-card">
              <h3>Thông tin chuyển khoản</h3>

              <div className="wallet-transfer-form-grid">
                <div className="wallet-transfer-field full">
                  <label htmlFor="receiverAccount">Tài khoản nhận</label>
                  <input
                    id="receiverAccount"
                    type="text"
                    value={receiverAccountNumber}
                    onChange={(e) => {
                      setReceiverAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20));
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    onBlur={() => {
                      if (receiverAccountNumber.trim().length >= 6) {
                        verifyReceiverAccount(receiverAccountNumber);
                      }
                    }}
                    placeholder="Nhập số tài khoản người nhận"
                  />
                  {receiverLookupState === 'loading' && (
                    <div className="wallet-transfer-receiver-meta loading">
                      <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                      Đang xác minh tài khoản nhận...
                    </div>
                  )}
                  {receiverLookupState === 'verified' && (
                    <div className="wallet-transfer-receiver-meta success">
                      <i className="bi bi-check-circle-fill"></i>
                      Người nhận: <strong>{receiverName}</strong>
                    </div>
                  )}
                  {receiverLookupState === 'error' && receiverLookupError && (
                    <div className="wallet-transfer-receiver-meta error">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {receiverLookupError}
                    </div>
                  )}
                </div>

                <div className="wallet-transfer-field full">
                  <label htmlFor="transferAmount">Số tiền</label>
                  <div className="wallet-topup-amount-box">
                    <input
                      id="transferAmount"
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

                <div className="wallet-transfer-field full">
                  <label htmlFor="transferDesc">Nội dung chuyển khoản</label>
                  <textarea
                    id="transferDesc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ví dụ: Chuyển tiền ăn trưa"
                  />
                </div>
              </div>

              <div className="wallet-topup-submit-row">
                <button
                  type="button"
                  className="wallet-btn wallet-btn-primary btn btn-primary"
                  onClick={handleOpenPinModal}
                  disabled={isSubmitting}
                >
                  Tiếp tục
                </button>
              </div>
            </article>

            <aside className="wallet-transfer-preview-card">
              <h4>Tóm tắt giao dịch</h4>
              <div className="wallet-transfer-preview-item">
                <small>Tài khoản nguồn</small>
                <strong>{senderAccountNumber || '--'}</strong>
              </div>
              <div className="wallet-transfer-preview-item">
                <small>Người nhận</small>
                <strong>{receiverName || receiverAccountNumber || '--'}</strong>
              </div>
              <div className="wallet-transfer-preview-item">
                <small>Số tiền</small>
                <strong>{formatVnd(amount)}</strong>
              </div>
              <div className="wallet-transfer-preview-item">
                <small>Nội dung</small>
                <strong>{description.trim() || 'Chưa nhập nội dung'}</strong>
              </div>

              <div className="wallet-transfer-tip">
                <i className="bi bi-shield-check"></i>
                <span>Kiểm tra kỹ số tài khoản nhận trước khi xác nhận giao dịch.</span>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {isPinModalOpen && (
        <div className="wallet-transfer-modal-backdrop" role="presentation" onClick={() => setIsPinModalOpen(false)}>
          <div className="wallet-transfer-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-transfer-modal-head">
              <h3>Xác nhận giao dịch</h3>
              <button type="button" className="wallet-transfer-modal-close" onClick={() => setIsPinModalOpen(false)} aria-label="Đóng">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="wallet-transfer-modal-body">
              <p>
                Bạn đang chuyển <strong>{formatVnd(amount)}</strong> đến <strong>{receiverName || receiverAccountNumber}</strong>.
              </p>
              <label htmlFor="transferPinModal">Nhập mã PIN để xác nhận</label>
              <input
                id="transferPinModal"
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setPinModalError('');
                }}
                placeholder="••••••"
                maxLength={6}
                autoFocus
              />
              {pinModalError && <div className="wallet-transfer-modal-error">{pinModalError}</div>}
            </div>
            <div className="wallet-transfer-modal-foot">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setIsPinModalOpen(false)}>
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitTransfer}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
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

export default Transfer;
