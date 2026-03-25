import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WalletTopbar from '../components/WalletTopbar';
import { useToast } from '../context/ToastContext';
import { extractAvatarUrl, storeAvatar } from '../utils/avatar';
import { parseApiErrorMessage } from '../utils/httpError';
import '../css/dashboard.css';

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')} VND`;

const parseCurrencyInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

const toErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.status === 403) {
    return 'Bạn không có quyền truy cập dữ liệu này.';
  }

  if (error?.response?.status >= 500) {
    return 'Máy chủ đang bận. Vui lòng thử lại sau ít phút.';
  }

  return parseApiErrorMessage(error, fallbackMessage);
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();
  const [profileData, setProfileData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [savingsData, setSavingsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [isWalletLocked, setIsWalletLocked] = useState(true);
  const [isSavingsSubmitting, setIsSavingsSubmitting] = useState(false);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState({ incoming: 0, outgoing: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isRecentTxLoading, setIsRecentTxLoading] = useState(false);
  const [savingsTransferModal, setSavingsTransferModal] = useState({
    open: false,
    mode: 'deposit',
    amountInput: '10000',
    paymentPin: '',
  });
  const [pinModal, setPinModal] = useState({
    open: false,
    password: '',
    pin: '',
    confirmPin: '',
  });
  const [savingsGoalModal, setSavingsGoalModal] = useState({
    open: false,
    targetAmountInput: '',
  });

  const firstName = useMemo(() => {
    const raw = profileData?.people?.fullName || walletData?.ownerName || walletData?.fullName || 'Bạn';
    return raw.trim().split(' ').slice(-1)[0] || 'Bạn';
  }, [profileData, walletData]);

  const monthlyInsights = useMemo(() => {
    const incoming = Number(monthlySummary?.incoming || 0);
    const outgoing = Number(monthlySummary?.outgoing || 0);
    const budget = Math.max(Math.round(outgoing * 1.6), 5000000);
    const savingsGoal = Number(savingsData?.targetAmount || 0);
    const currentSaving = Number(savingsData?.balance || 0);
    const budgetUsed = Math.min(100, Math.round((outgoing / budget) * 100));
    const goalProgress = savingsGoal > 0 ? Math.min(100, Math.round((currentSaving / savingsGoal) * 100)) : 0;

    return {
      incoming,
      outgoing,
      budget,
      budgetUsed,
      savingsGoal,
      currentSaving,
      goalProgress,
      net: incoming - outgoing,
    };
  }, [monthlySummary, savingsData]);

  const balanceLabel = isWalletLocked ? '••••••••' : (walletData?.balance || 0).toLocaleString('vi-VN');
  const accountNumber = walletData?.accountNumber || '----';
  const fullName = profileData?.people?.fullName || walletData?.ownerName || `Khách hàng ${firstName}`;

  const loadMonthlySummary = async (accountNumber) => {
    if (!accountNumber) {
      setMonthlySummary({ incoming: 0, outgoing: 0 });
      return;
    }

    try {
      const summaryResponse = await api.get(`/api/transactions/summary/${accountNumber}/monthly`);
      setMonthlySummary({
        incoming: Number(summaryResponse.data?.incoming || 0),
        outgoing: Number(summaryResponse.data?.outgoing || 0),
      });
    } catch (error) {
      setMonthlySummary({ incoming: 0, outgoing: 0 });
    }
  };

  const loadRecentTransactions = async (accountNumber) => {
    if (!accountNumber) {
      setRecentTransactions([]);
      return;
    }

    setIsRecentTxLoading(true);

    try {
      const response = await api.get(`/api/transactions/history/${accountNumber}`, {
        params: { page: 0, size: 5 },
      });

      const rows = response.data?.content || [];
      const normalized = rows.map((item, index) => {
        const amountNumber = Number(item?.amount || 0);
        const createdDate = item?.createdDate ? new Date(item.createdDate) : null;
        return {
          id: item?.transactionCode || `${accountNumber}-${index}`,
          description: item?.description || 'Giao dịch đã ghi nhận',
          relatedParty: item?.relatedParty || '--',
          timeLabel: createdDate && !Number.isNaN(createdDate.getTime())
            ? createdDate.toLocaleString('vi-VN')
            : `Mã ${item?.transactionCode || '--'}`,
          amountNumber,
          amountLabel: `${amountNumber >= 0 ? '+' : '-'}${formatVnd(Math.abs(amountNumber))}`,
          direction: amountNumber >= 0 ? 'in' : 'out',
        };
      });

      setRecentTransactions(normalized);
    } catch {
      setRecentTransactions([]);
    } finally {
      setIsRecentTxLoading(false);
    }
  };

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

  const loadDashboardData = async ({ refresh = false } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMsg('');
    setWarningMsg('');

    const warnings = [];

    try {
      let nextProfile = profileData;
      let nextAccount = walletData;
      let nextAccountNumber = '';

      try {
        const profileResponse = await api.get('/api/users/my-profile', { params: { _ts: Date.now() } });
        nextProfile = profileResponse.data || null;
      } catch (error) {
        const isHandled = await handleAuthNavigation(error);
        if (isHandled) return;
        warnings.push('Không tải được hồ sơ cá nhân.');
      }

      try {
        const primaryAccountResponse = await api.get('/api/accounts/my-account');
        nextAccount = primaryAccountResponse.data || null;
        nextAccountNumber = nextAccount?.accountNumber || '';
      } catch (primaryError) {
        const isHandled = await handleAuthNavigation(primaryError);
        if (isHandled) return;

        try {
          const accountListResponse = await api.get('/api/accounts/my-accounts');
          const fallbackAccount = accountListResponse.data?.[0] || null;
          nextAccount = fallbackAccount;
          nextAccountNumber = fallbackAccount?.accountNumber || '';
          if (!fallbackAccount) {
            warnings.push('Bạn chưa có tài khoản ví khả dụng.');
          }
        } catch (fallbackError) {
          const fallbackHandled = await handleAuthNavigation(fallbackError);
          if (fallbackHandled) return;
          warnings.push('Không tải được thông tin tài khoản ví.');
        }
      }

      try {
        const savingsResponse = await api.get('/api/accounts/savings');
        setSavingsData(savingsResponse.data || null);
      } catch (error) {
        const isHandled = await handleAuthNavigation(error);
        if (isHandled) return;
        setSavingsData(null);
        warnings.push('Không tải được thông tin tài khoản tiết kiệm.');
      }

      setProfileData(nextProfile || null);
      setWalletData(nextAccount || null);

      const nextAvatarUrl = extractAvatarUrl(nextProfile);
      storeAvatar(nextAvatarUrl);

      if (nextAccountNumber) {
        await loadMonthlySummary(nextAccountNumber);
        await loadRecentTransactions(nextAccountNumber);
      } else {
        setMonthlySummary({ incoming: 0, outgoing: 0 });
        setRecentTransactions([]);
      }

      if (!nextProfile && !nextAccount) {
        setErrorMsg('Không thể tải dữ liệu dashboard.');
        toast.error('Không thể tải dữ liệu dashboard.');
      } else if (warnings.length > 0) {
        setWarningMsg(warnings.join(' '));
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout, navigate]);

  const handleRefreshDashboard = async () => {
    await loadDashboardData({ refresh: true });
  };

  const handleCopyAccountNumber = async () => {
    if (!accountNumber || accountNumber === '----') {
      toast.info('Chưa có số tài khoản để sao chép.');
      return;
    }

    try {
      await navigator.clipboard.writeText(accountNumber);
      toast.success('Đã sao chép số tài khoản.');
    } catch {
      toast.error('Không thể sao chép số tài khoản.');
    }
  };

  const handleOpenSavingsAccount = async () => {
    const targetInput = window.prompt('Nhập mục tiêu tiết kiệm (VND):', '15000000');
    if (targetInput === null) return;

    const targetAmount = parseCurrencyInput(targetInput);
    if (targetAmount <= 0) {
      setWarningMsg('Mục tiêu tiết kiệm phải lớn hơn 0.');
      return;
    }

    setIsSavingsSubmitting(true);
    setWarningMsg('');

    try {
      await api.post('/api/accounts/savings/open', { targetAmount });
      await loadDashboardData({ refresh: true });
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = toErrorMessage(error, 'Không thể mở tài khoản tiết kiệm.');
      setWarningMsg(message);
      toast.error(message);
    } finally {
      setIsSavingsSubmitting(false);
    }
  };

  const handleUpdateSavingsGoal = async () => {
    if (!savingsData?.accountNumber) {
      await handleOpenSavingsAccount();
      return;
    }

    setSavingsGoalModal({
      open: true,
      targetAmountInput: String(Number(savingsData?.targetAmount || 0)),
    });
  };

  const closeSavingsGoalModal = () => {
    if (isSavingsSubmitting) return;
    setSavingsGoalModal((prev) => ({ ...prev, open: false }));
  };

  const handleSavingsGoalFieldChange = (value) => {
    setSavingsGoalModal((prev) => ({ ...prev, targetAmountInput: value }));
  };

  const handleSubmitSavingsGoal = async () => {
    const targetAmount = parseCurrencyInput(savingsGoalModal.targetAmountInput);
    if (targetAmount <= 0) {
      setWarningMsg('Mục tiêu tiết kiệm phải lớn hơn 0.');
      return;
    }

    setIsSavingsSubmitting(true);
    setWarningMsg('');

    try {
      await api.put('/api/accounts/savings/goal', { targetAmount });
      await loadDashboardData({ refresh: true });
      toast.success('Cập nhật mục tiêu tiết kiệm thành công.');
      setSavingsGoalModal((prev) => ({ ...prev, open: false }));
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = toErrorMessage(error, 'Không thể cập nhật mục tiêu tiết kiệm.');
      setWarningMsg(message);
      toast.error(message);
    } finally {
      setIsSavingsSubmitting(false);
    }
  };

  const executeSavingsTransfer = async ({ endpoint, successMessage, fallbackMessage, amount, paymentPin }) => {
    if (!walletData?.accountNumber || !savingsData?.accountNumber) {
      setWarningMsg('Thiếu thông tin tài khoản để thực hiện giao dịch tiết kiệm.');
      return;
    }

    setIsSavingsSubmitting(true);
    setWarningMsg('');

    try {
      await api.post(endpoint, {
        paymentAccount: walletData.accountNumber,
        savingsAccount: savingsData.accountNumber,
        amount,
        paymentPin,
      });

      await loadDashboardData({ refresh: true });
      toast.success(successMessage);
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = toErrorMessage(error, fallbackMessage);
      setWarningMsg(message);
      toast.error(message);
    } finally {
      setIsSavingsSubmitting(false);
    }
  };

  const openSavingsTransferModal = (mode) => {
    setSavingsTransferModal({
      open: true,
      mode,
      amountInput: '100000',
      paymentPin: '',
    });
  };

  const closeSavingsTransferModal = () => {
    if (isSavingsSubmitting) return;
    setSavingsTransferModal((prev) => ({ ...prev, open: false }));
  };

  const handleSavingsTransferFieldChange = (field, value) => {
    setSavingsTransferModal((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitSavingsTransfer = async () => {
    const amount = parseCurrencyInput(savingsTransferModal.amountInput);
    if (amount <= 0) {
      setWarningMsg('Số tiền phải lớn hơn 0.');
      return;
    }

    const paymentPin = savingsTransferModal.paymentPin.trim();
    if (!paymentPin) {
      setWarningMsg('Mã PIN không được để trống.');
      return;
    }

    const isDeposit = savingsTransferModal.mode === 'deposit';
    await executeSavingsTransfer({
      endpoint: isDeposit ? '/api/accounts/savings/deposit' : '/api/accounts/savings/withdraw',
      successMessage: isDeposit ? 'Nạp tiền tiết kiệm thành công.' : 'Rút tiền tiết kiệm thành công.',
      fallbackMessage: isDeposit ? 'Không thể nạp tiền tiết kiệm.' : 'Không thể rút tiền tiết kiệm.',
      amount,
      paymentPin,
    });

    setSavingsTransferModal((prev) => ({
      ...prev,
      open: false,
      amountInput: '100000',
      paymentPin: '',
    }));
  };

  const handleSavingsDeposit = () => {
    openSavingsTransferModal('deposit');
  };

  const handleSavingsWithdraw = () => {
    openSavingsTransferModal('withdraw');
  };

  const openPinModal = () => {
    setPinModal({
      open: true,
      password: '',
      pin: '',
      confirmPin: '',
    });
  };

  const closePinModal = () => {
    if (isPinSubmitting) return;
    setPinModal((prev) => ({ ...prev, open: false }));
  };

  const handlePinFieldChange = (field, value) => {
    setPinModal((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitPin = async () => {
    if (!walletData?.accountNumber) {
      setWarningMsg('Không tìm thấy tài khoản ví để thiết lập mã PIN.');
      return;
    }

    const password = pinModal.password.trim();
    const pin = pinModal.pin.trim();
    const confirmPin = pinModal.confirmPin.trim();

    if (!password) {
      setWarningMsg('Mật khẩu đăng nhập không được để trống.');
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setWarningMsg('Mã PIN phải là số và dài từ 4 đến 6 ký tự.');
      return;
    }

    if (pin !== confirmPin) {
      setWarningMsg('Mã PIN xác nhận không khớp.');
      return;
    }

    setIsPinSubmitting(true);
    setWarningMsg('');

    try {
      await api.put('/api/accounts/set-pin', {
        password,
        accountNumber: walletData.accountNumber,
        pin,
      });
      toast.success('Thiết lập mã PIN thành công.');
      setPinModal((prev) => ({
        ...prev,
        open: false,
        password: '',
        pin: '',
        confirmPin: '',
      }));
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      const message = toErrorMessage(error, 'Không thể thiết lập mã PIN.');
      setWarningMsg(message);
      toast.error(message);
    } finally {
      setIsPinSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="wallet-skeleton-wrap">
        <div className="wallet-skeleton skeleton-lg"></div>
        <div className="wallet-skeleton-grid">
          <div className="wallet-skeleton skeleton-md"></div>
          <div className="wallet-skeleton skeleton-md"></div>
          <div className="wallet-skeleton skeleton-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-dashboard-shell">
      <WalletTopbar />

      <main className="wallet-dashboard-body">
        {errorMsg && (
          <div className="alert alert-danger mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>{errorMsg}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleRefreshDashboard}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Đang thử lại...' : 'Thử lại'}
            </button>
          </div>
        )}

        {warningMsg && !errorMsg && (
          <div className="alert alert-warning mb-3">{warningMsg}</div>
        )}
        <section className="wallet-customer-showcase wallet-fade-up wallet-delay-2">
          <article className="wallet-purple-hero">
            <div className="wallet-hero-toolbar">
              <span className="wallet-hero-brand">NovaPay</span>
              <div className="wallet-hero-icons">
                <button type="button" aria-label="Thông báo"><i className="bi bi-bell"></i></button>
                <button type="button" aria-label="Tìm kiếm"><i className="bi bi-search"></i></button>
              </div>
            </div>

            <div className="wallet-hero-actions">
              <Link to="/topup"><i className="bi bi-plus-lg"></i> Nạp</Link>
              <Link to="/transfer"><i className="bi bi-arrow-left-right"></i> Chuyển</Link>
              <Link to="/services"><i className="bi bi-grid"></i> Dịch vụ</Link>
              <Link to="/transactions"><i className="bi bi-clock-history"></i> Lịch sử</Link>
            </div>

            <div className="wallet-hero-greet">
              <h2>Xin chào, {firstName}!</h2>
              <p>Chúc bạn một ngày tốt lành.</p>
            </div>

            <div className="wallet-device-card">
              <div className="wallet-device-head">
                <div className="wallet-device-avatar"><i className="bi bi-person"></i></div>
                <strong>{fullName}</strong>
              </div>
              <p>Số tài khoản: {accountNumber}</p>
              <button
                type="button"
                className="wallet-device-pin-btn"
                onClick={openPinModal}
                disabled={isPinSubmitting || isRefreshing}
              >
                <i className="bi bi-shield-lock"></i>
                Thay đổi mã PIN
              </button>
              <div className="wallet-device-balance-row">
                <h3>{balanceLabel} <span>VND</span></h3>
                <button type="button" onClick={() => setIsWalletLocked((current) => !current)}>
                  <i className={`bi ${isWalletLocked ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
          </article>

          <aside className="wallet-overview-panel">
            <div className="wallet-overview-head">
              <h3>Tổng quan</h3>
              <button type="button" onClick={handleRefreshDashboard} disabled={isRefreshing}>
                {isRefreshing ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>

            <div className="wallet-overview-metrics">
              <div className="wallet-overview-item positive">
                <small>Tổng thu</small>
                <strong>+ {formatVnd(monthlyInsights.incoming)}</strong>
              </div>
              <div className="wallet-overview-item negative">
                <small>Tổng chi</small>
                <strong>- {formatVnd(monthlyInsights.outgoing)}</strong>
              </div>
              <div className="wallet-overview-item neutral">
                <small>Chênh lệch</small>
                <strong>{monthlyInsights.net >= 0 ? '+' : '-'} {formatVnd(Math.abs(monthlyInsights.net))}</strong>
              </div>
            </div>

            <div className="wallet-overview-goal">
              <div className="wallet-goal-head">
                <div>
                  <h4><i className="bi bi-piggy-bank"></i>Mục tiêu tiết kiệm</h4>
                  {savingsData?.accountNumber ? (
                    <p>{monthlyInsights.currentSaving.toLocaleString('vi-VN')} / {monthlyInsights.savingsGoal.toLocaleString('vi-VN')} VND</p>
                  ) : (
                    <p>Chưa mở tài khoản tiết kiệm</p>
                  )}
                </div>
                <span className="wallet-goal-badge">{monthlyInsights.goalProgress}%</span>
              </div>
              <div className="wallet-progress-bar">
                <div style={{ width: `${monthlyInsights.goalProgress}%` }}></div>
              </div>
              <div className="wallet-goal-actions-grid">
                <div className="wallet-goal-actions-left">
                  <button
                    type="button"
                    className="wallet-goal-action-btn is-soft"
                    onClick={handleSavingsDeposit}
                    disabled={isSavingsSubmitting || isRefreshing || !savingsData?.accountNumber}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Nạp tiền tiết kiệm
                  </button>
                  <button
                    type="button"
                    className="wallet-goal-action-btn is-soft"
                    onClick={handleSavingsWithdraw}
                    disabled={isSavingsSubmitting || isRefreshing || !savingsData?.accountNumber}
                  >
                    <i className="bi bi-dash-circle"></i>
                    Rút tiền tiết kiệm
                  </button>
                </div>

                <button
                  type="button"
                  className="wallet-overview-goal-btn"
                  onClick={savingsData?.accountNumber ? handleUpdateSavingsGoal : handleOpenSavingsAccount}
                  disabled={isSavingsSubmitting || isRefreshing}
                >
                  {isSavingsSubmitting
                    ? 'Đang xử lý...'
                    : savingsData?.accountNumber
                      ? 'Cập nhật mục tiêu'
                      : 'Mở tài khoản tiết kiệm'}
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section className="wallet-grid wallet-fade-up wallet-delay-2">
          <div className="wallet-left-col">
            <article className="wallet-spending-card">
              <div className="wallet-goal-head mb-2">
                <div>
                  <h3>Phân tích chi tiêu</h3>
                  <p>So sánh ngân sách dự kiến và chi tiêu thực tế trong tháng.</p>
                </div>
                <span className="wallet-goal-badge">{monthlyInsights.budgetUsed}%</span>
              </div>

              <div className="wallet-spending-grid">
                <div className="wallet-spending-donut"></div>
                <div className="wallet-spending-legend">
                  <p><span className="dot housing"></span> Ngân sách tháng <strong>{formatVnd(monthlyInsights.budget)}</strong></p>
                  <p><span className="dot transfer"></span> Đã chi tiêu <strong>{formatVnd(monthlyInsights.outgoing)}</strong></p>
                  <p><span className="dot shopping"></span> Còn khả dụng <strong>{formatVnd(Math.max(monthlyInsights.budget - monthlyInsights.outgoing, 0))}</strong></p>
                </div>
              </div>
            </article>

            <article className="wallet-actions-card">
              <div className="wallet-goal-head mb-2">
                <div>
                  <h3>Thao tác nhanh</h3>
                  <p>Đi nhanh đến các tác vụ thường dùng.</p>
                </div>
              </div>

              <div className="wallet-quick-grid">
                <button type="button" onClick={() => navigate('/topup')}>
                  <i className="bi bi-wallet2"></i>
                  <span>Nạp tiền</span>
                </button>
                <button type="button" onClick={() => navigate('/transfer')}>
                  <i className="bi bi-send"></i>
                  <span>Chuyển tiền</span>
                </button>
                <button type="button" onClick={handleCopyAccountNumber}>
                  <i className="bi bi-copy"></i>
                  <span>Sao chép số tài khoản</span>
                </button>
                <button type="button" onClick={openPinModal}>
                  <i className="bi bi-shield-lock"></i>
                  <span>Quản lý mã PIN</span>
                </button>
              </div>
            </article>

            <article className="wallet-promo-banner">
              <div>
                <p className="wallet-promo-eyebrow">NovaPay Plus</p>
                <h3>Kích hoạt gói ưu đãi dịch vụ tháng này</h3>
                <p>Nhận hoàn tiền và giảm phí khi thanh toán hóa đơn định kỳ.</p>
              </div>
              <Link to="/services" className="wallet-btn wallet-btn-primary">Khám phá</Link>
            </article>
          </div>

          <div className="wallet-right-col">
            <article className="wallet-history-card wallet-mini-history-card">
              <div className="wallet-history-head">
                <h3>Giao dịch gần đây</h3>
                <button type="button" onClick={() => navigate('/transactions')}>Xem tất cả</button>
              </div>

              <div className="wallet-history-list">
                {isRecentTxLoading ? (
                  <div className="wallet-history-loading">Đang tải lịch sử giao dịch...</div>
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => (
                    <div className="wallet-history-item" key={tx.id}>
                      <span className={`wallet-history-icon ${tx.direction}`}>
                        <i className={`bi ${tx.direction === 'in' ? 'bi-arrow-down-right' : 'bi-arrow-up-right'}`}></i>
                      </span>
                      <div className="wallet-history-info">
                        <strong>{tx.description}</strong>
                        <small>{tx.timeLabel}</small>
                      </div>
                      <div className="wallet-history-amount">
                        <strong className={tx.direction === 'in' ? 'positive' : 'negative'}>{tx.amountLabel}</strong>
                        <small>{tx.relatedParty}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="wallet-history-empty">Chưa có giao dịch gần đây.</div>
                )}
              </div>
            </article>

            <article className="wallet-offer-list-card">
              <div className="wallet-offer-head">
                <h3>Đề xuất cho bạn</h3>
                <Link to="/services">Xem tất cả</Link>
              </div>

              <div className="wallet-offer-list">
                <div className="wallet-offer-item">
                  <strong>Thanh toán hóa đơn tự động</strong>
                  <p>Thiết lập một lần, không lo trễ hạn thanh toán điện nước.</p>
                </div>
                <div className="wallet-offer-item">
                  <strong>Nhắc nạp tiết kiệm hàng tuần</strong>
                  <p>Tự động tạo thói quen tiết kiệm đều đặn theo mục tiêu.</p>
                </div>
                <div className="wallet-offer-item">
                  <strong>Quản lý giao dịch thông minh</strong>
                  <p>Lọc và theo dõi biến động chi tiêu theo từng nhóm dịch vụ.</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      {savingsTransferModal.open && (
        <div className="wallet-savings-modal-backdrop" role="dialog" aria-modal="true">
          <div className="wallet-savings-modal-card">
            <div className="wallet-savings-modal-head">
              <h4>{savingsTransferModal.mode === 'deposit' ? 'Nạp tiền tiết kiệm' : 'Rút tiền tiết kiệm'}</h4>
              <button
                type="button"
                onClick={closeSavingsTransferModal}
                disabled={isSavingsSubmitting}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="wallet-savings-modal-body">
              <label htmlFor="savingsAmount">Số tiền (VND)</label>
              <input
                id="savingsAmount"
                type="text"
                inputMode="numeric"
                value={savingsTransferModal.amountInput}
                onChange={(event) => handleSavingsTransferFieldChange('amountInput', event.target.value)}
                placeholder="Nhập số tiền"
                disabled={isSavingsSubmitting}
              />

              <label htmlFor="paymentPin">Mã PIN ví thanh toán</label>
              <input
                id="paymentPin"
                type="password"
                value={savingsTransferModal.paymentPin}
                onChange={(event) => handleSavingsTransferFieldChange('paymentPin', event.target.value)}
                placeholder="Nhập mã PIN"
                disabled={isSavingsSubmitting}
              />
            </div>

            <div className="wallet-savings-modal-actions">
              <button
                type="button"
                className="wallet-savings-btn cancel"
                onClick={closeSavingsTransferModal}
                disabled={isSavingsSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="wallet-savings-btn confirm"
                onClick={handleSubmitSavingsTransfer}
                disabled={isSavingsSubmitting}
              >
                {isSavingsSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {savingsGoalModal.open && (
        <div className="wallet-savings-modal-backdrop" role="dialog" aria-modal="true">
          <div className="wallet-savings-modal-card">
            <div className="wallet-savings-modal-head">
              <h4>Cập nhật mục tiêu tiết kiệm</h4>
              <button
                type="button"
                onClick={closeSavingsGoalModal}
                disabled={isSavingsSubmitting}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="wallet-savings-modal-body">
              <label htmlFor="savingsGoalAmount">Mục tiêu mới (VND)</label>
              <input
                id="savingsGoalAmount"
                type="text"
                inputMode="numeric"
                value={savingsGoalModal.targetAmountInput}
                onChange={(event) => handleSavingsGoalFieldChange(event.target.value)}
                placeholder="Nhập mục tiêu tiết kiệm"
                disabled={isSavingsSubmitting}
              />
            </div>

            <div className="wallet-savings-modal-actions">
              <button
                type="button"
                className="wallet-savings-btn cancel"
                onClick={closeSavingsGoalModal}
                disabled={isSavingsSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="wallet-savings-btn confirm"
                onClick={handleSubmitSavingsGoal}
                disabled={isSavingsSubmitting}
              >
                {isSavingsSubmitting ? 'Đang xử lý...' : 'Lưu mục tiêu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pinModal.open && (
        <div className="wallet-savings-modal-backdrop" role="dialog" aria-modal="true">
          <div className="wallet-savings-modal-card">
            <div className="wallet-savings-modal-head">
              <h4>Tạo / Đổi mã PIN ví</h4>
              <button
                type="button"
                onClick={closePinModal}
                disabled={isPinSubmitting}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="wallet-savings-modal-body">
              <label htmlFor="walletPassword">Mật khẩu đăng nhập</label>
              <input
                id="walletPassword"
                type="password"
                value={pinModal.password}
                onChange={(event) => handlePinFieldChange('password', event.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isPinSubmitting}
              />

              <label htmlFor="walletPin">Mã PIN mới (4-6 số)</label>
              <input
                id="walletPin"
                type="password"
                inputMode="numeric"
                value={pinModal.pin}
                onChange={(event) => handlePinFieldChange('pin', event.target.value)}
                placeholder="Nhập mã PIN mới"
                disabled={isPinSubmitting}
              />

              <label htmlFor="walletPinConfirm">Xác nhận mã PIN</label>
              <input
                id="walletPinConfirm"
                type="password"
                inputMode="numeric"
                value={pinModal.confirmPin}
                onChange={(event) => handlePinFieldChange('confirmPin', event.target.value)}
                placeholder="Nhập lại mã PIN"
                disabled={isPinSubmitting}
              />
            </div>

            <div className="wallet-savings-modal-actions">
              <button
                type="button"
                className="wallet-savings-btn cancel"
                onClick={closePinModal}
                disabled={isPinSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="wallet-savings-btn confirm"
                onClick={handleSubmitPin}
                disabled={isPinSubmitting}
              >
                {isPinSubmitting ? 'Đang xử lý...' : 'Lưu mã PIN'}
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

export default CustomerDashboard;
