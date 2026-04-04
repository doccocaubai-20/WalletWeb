import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import WalletTopbar from '../components/WalletTopbar';
import { parseApiErrorMessage } from '../utils/httpError';
import { validateLinkedBankRequest } from '../utils/formValidation';
import '../css/dashboard.css';

const isActiveLinkedBank = (bank) => String(bank?.status || '').toUpperCase() === 'ACTIVE';

const LinkedBanks = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [linkedBanks, setLinkedBanks] = useState([]);
  const [supportedBanks, setSupportedBanks] = useState([]);
  const [linkBankId, setLinkBankId] = useState('');
  const [linkBankAccountInput, setLinkBankAccountInput] = useState('');

  const clearMessages = useCallback(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, []);

  const loadBanksData = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) {
      setIsLoading(true);
    }
    setErrorMsg('');

    try {
      const [linkedResponse, supportedResponse] = await Promise.all([
        api.get('/api/banks/linked'),
        api.get('/api/banks'),
      ]);

      const linked = linkedResponse.data || [];
      const supported = supportedResponse.data || [];

      setLinkedBanks(linked);
      setSupportedBanks(supported);
      setLinkBankId((current) => {
        if (current && supported.some((bank) => String(bank.id) === String(current))) {
          return current;
        }
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

      const message = parseApiErrorMessage(error, 'Không thể tải danh sách ngân hàng liên kết.');
      setErrorMsg(message);
      toast.error(message);
    } finally {
      if (showSkeleton) {
        setIsLoading(false);
      }
    }
  }, [logout, navigate, toast]);

  useEffect(() => {
    loadBanksData();
  }, [loadBanksData]);

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
      await api.post('/api/banks/link', {
        bankId: Number(linkBankId),
        accountNumber: linkBankAccountInput.trim(),
      });

      setLinkBankAccountInput('');
      setSuccessMsg('Liên kết ngân hàng thành công.');
      toast.success('Liên kết ngân hàng thành công.');
      await loadBanksData(false);
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

  const handleUnlinkBank = async (id) => {
    setIsDeletingId(id);
    clearMessages();

    try {
      await api.delete(`/api/banks/${id}`);
      setSuccessMsg('Hủy liên kết ngân hàng thành công.');
      toast.success('Đã hủy liên kết ngân hàng.');
      await loadBanksData(false);
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      const message = parseApiErrorMessage(error, 'Hủy liên kết ngân hàng thất bại.');
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="wallet-skeleton-wrap">
        <div className="wallet-skeleton skeleton-lg"></div>
      </div>
    );
  }

  const activeLinkedBanks = linkedBanks.filter(isActiveLinkedBank);

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
                <h1>Ngân hàng liên kết</h1>
                <div className="wallet-transfer-head-meta">
                  <p>Quản lý danh sách ngân hàng dùng để nạp và rút tiền.</p>
                </div>
              </div>
              <Link to="/topup" className="wallet-topup-back btn btn-outline-secondary">
                <i className="bi bi-arrow-left"></i>
                Quay lại Nạp/Rút
              </Link>
            </div>
          </div>

          <div className="wallet-topup-card wallet-fade-up wallet-delay-1">
            <div className="wallet-topup-bank-head">
              <h3>Ngân hàng đã liên kết</h3>
              <small>{activeLinkedBanks.length} liên kết hiện có</small>
            </div>

            {activeLinkedBanks.length === 0 && (
              <div className="wallet-topup-empty">Bạn chưa có ngân hàng liên kết nào.</div>
            )}

            {activeLinkedBanks.length > 0 && (
              <div className="wallet-linked-bank-grid">
                {activeLinkedBanks.map((bank) => (
                  <div key={bank.id} className="wallet-linked-bank-item wallet-linked-bank-card">
                    <span className="bank-name">{bank.bankName}</span>
                    <div className="wallet-linked-bank-meta">
                      <small>{bank.maskedAccountNumber}</small>
                      <span className="wallet-bank-status active">ACTIVE</span>
                    </div>
                    <div className="wallet-linked-bank-actions">
                      <button
                        type="button"
                        className="wallet-unlink-btn"
                        onClick={() => handleUnlinkBank(bank.id)}
                        disabled={isDeletingId === bank.id}
                      >
                        {isDeletingId === bank.id ? 'Đang hủy...' : 'Hủy liên kết'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="wallet-topup-card wallet-fade-up wallet-delay-2">
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
                <label htmlFor="linkedBankAccountNumber">Số tài khoản ngân hàng</label>
                <input
                  id="linkedBankAccountNumber"
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
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default LinkedBanks;