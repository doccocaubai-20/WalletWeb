import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../css/dashboard.css';

const DEFAULT_SPENDING_SPLIT = {
  housing: 45,
  transfer: 30,
  shopping: 25,
};

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')} VND`;

const parseCurrencyInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

const normalizeTxStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SUCCESS') return 'Thành công';
  if (normalized === 'PENDING') return 'Chờ xử lý';
  if (normalized === 'FAILED') return 'Thất bại';
  return 'Đã ghi nhận';
};

const toErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.status === 403) {
    return 'Bạn không có quyền truy cập dữ liệu này.';
  }

  if (error?.response?.status >= 500) {
    return 'Máy chủ đang bận. Vui lòng thử lại sau ít phút.';
  }

  if (typeof error?.response?.data === 'string' && error.response.data.trim()) {
    return error.response.data;
  }

  return fallbackMessage;
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [savingsData, setSavingsData] = useState(null);
  const [activeAccountNumber, setActiveAccountNumber] = useState('');
  const [transactionRows, setTransactionRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [txErrorMsg, setTxErrorMsg] = useState('');
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txFilter, setTxFilter] = useState('all');
  const [isWalletLocked, setIsWalletLocked] = useState(false);
  const [isSavingsSubmitting, setIsSavingsSubmitting] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState({ incoming: 0, outgoing: 0 });

  const TX_PAGE_SIZE = 10;

  const firstName = useMemo(() => {
    const raw = profileData?.people?.fullName || walletData?.ownerName || walletData?.fullName || 'Bạn';
    return raw.trim().split(' ').slice(-1)[0] || 'Bạn';
  }, [profileData, walletData]);

  const recentTransactions = useMemo(
    () => transactionRows.map((tx, index) => {
      const amountNumber = Number(tx.amount || 0);
      const txKind = String(tx.type || '').toUpperCase() === 'IN' ? 'in' : 'out';
      const isPending = String(tx.status || '').toUpperCase() !== 'SUCCESS';
      const type = isPending ? 'pending' : txKind;
      const absAmount = Math.abs(amountNumber);
      const signedAmount = `${amountNumber >= 0 ? '+' : '-'}${formatVnd(absAmount)}`;

      return {
        id: tx.transactionCode || `${tx.relatedParty || 'tx'}-${index}`,
        title: tx.description || (txKind === 'in' ? `Nhận từ ${tx.relatedParty || 'không xác định'}` : `Chuyển đến ${tx.relatedParty || 'không xác định'}`),
        time: tx.transactionCode ? `Mã ${tx.transactionCode}` : 'Giao dịch đã ghi nhận',
        amount: signedAmount,
        status: normalizeTxStatus(tx.status),
        type,
        amountValue: absAmount,
        relatedParty: tx.relatedParty || '',
      };
    }),
    [transactionRows],
  );

  const filteredTransactions = useMemo(() => {
    if (txFilter === 'all') return recentTransactions;
    return recentTransactions.filter((tx) => tx.type === txFilter);
  }, [recentTransactions, txFilter]);

  const spendingSplit = useMemo(() => {
    const outgoingTransactions = recentTransactions.filter((tx) => tx.type === 'out');

    if (outgoingTransactions.length === 0) {
      return DEFAULT_SPENDING_SPLIT;
    }

    const categories = outgoingTransactions.reduce(
      (acc, tx) => {
        const amount = tx.amountValue || 0;
        const lowerDesc = String(tx.title || '').toLowerCase();

        if (/(sinh hoạt|điện|nước|tiền nhà|thuê)/i.test(lowerDesc)) {
          acc.housing += amount;
        } else if (/(mua|shop|siêu thị|thanh toán)/i.test(lowerDesc)) {
          acc.shopping += amount;
        } else {
          acc.transfer += amount;
        }

        return acc;
      },
      { housing: 0, transfer: 0, shopping: 0 },
    );

    const total = categories.housing + categories.transfer + categories.shopping;
    if (total <= 0) {
      return DEFAULT_SPENDING_SPLIT;
    }

    return {
      housing: Math.round((categories.housing / total) * 100),
      transfer: Math.round((categories.transfer / total) * 100),
      shopping: Math.round((categories.shopping / total) * 100),
    };
  }, [recentTransactions]);

  const recentReceivers = useMemo(() => {
    const unique = [];

    recentTransactions
      .filter((tx) => tx.type === 'out' && tx.relatedParty)
      .forEach((tx) => {
        const existed = unique.some((item) => item.relatedParty === tx.relatedParty);
        if (!existed) {
          unique.push({
            relatedParty: tx.relatedParty,
            label: tx.relatedParty,
            avatarSeed: tx.relatedParty,
          });
        }
      });

    return unique.slice(0, 3);
  }, [recentTransactions]);

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
      const fallbackIncoming = recentTransactions
        .filter((tx) => tx.type === 'in')
        .reduce((sum, tx) => sum + (tx.amountValue || 0), 0);
      const fallbackOutgoing = recentTransactions
        .filter((tx) => tx.type === 'out')
        .reduce((sum, tx) => sum + (tx.amountValue || 0), 0);

      setMonthlySummary({ incoming: fallbackIncoming, outgoing: fallbackOutgoing });
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

  const loadTransactionPage = async ({ accountNumber, page = 0, silent = false }) => {
    if (!accountNumber) {
      setTransactionRows([]);
      setTxPage(0);
      setTxTotalPages(1);
      return;
    }

    if (!silent) {
      setIsTransactionLoading(true);
    }
    setTxErrorMsg('');

    try {
      const historyResponse = await api.get(`/api/transactions/history/${accountNumber}`, {
        params: { page, size: TX_PAGE_SIZE },
      });

      setTransactionRows(historyResponse.data?.content || []);
      setTxPage(historyResponse.data?.number ?? page);
      setTxTotalPages(Math.max(historyResponse.data?.totalPages || 1, 1));
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;

      setTxErrorMsg(toErrorMessage(error, 'Không thể tải lịch sử giao dịch.'));
      setTransactionRows([]);
      setTxPage(0);
      setTxTotalPages(1);
    } finally {
      if (!silent) {
        setIsTransactionLoading(false);
      }
    }
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
      let nextAccountNumber = activeAccountNumber;

      try {
        const profileResponse = await api.get('/api/users/my-profile');
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
      setActiveAccountNumber(nextAccountNumber || '');

      if (nextAccountNumber) {
        await loadTransactionPage({ accountNumber: nextAccountNumber, page: 0, silent: refresh });
        await loadMonthlySummary(nextAccountNumber);
      } else {
        setTransactionRows([]);
        setTxPage(0);
        setTxTotalPages(1);
        setMonthlySummary({ incoming: 0, outgoing: 0 });
      }

      if (!nextProfile && !nextAccount) {
        setErrorMsg('Không thể tải dữ liệu dashboard.');
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

  const handleHistoryPageChange = async (nextPage) => {
    if (nextPage < 0 || nextPage >= txTotalPages || nextPage === txPage || !activeAccountNumber) {
      return;
    }

    await loadTransactionPage({ accountNumber: activeAccountNumber, page: nextPage });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleWalletLock = () => {
    setIsWalletLocked((current) => !current);
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
      setWarningMsg(toErrorMessage(error, 'Không thể mở tài khoản tiết kiệm.'));
    } finally {
      setIsSavingsSubmitting(false);
    }
  };

  const handleUpdateSavingsGoal = async () => {
    if (!savingsData?.accountNumber) {
      await handleOpenSavingsAccount();
      return;
    }

    const targetInput = window.prompt(
      'Nhập mục tiêu tiết kiệm mới (VND):',
      String(Number(savingsData?.targetAmount || 0)),
    );
    if (targetInput === null) return;

    const targetAmount = parseCurrencyInput(targetInput);
    if (targetAmount <= 0) {
      setWarningMsg('Mục tiêu tiết kiệm phải lớn hơn 0.');
      return;
    }

    setIsSavingsSubmitting(true);
    setWarningMsg('');

    try {
      await api.put('/api/accounts/savings/goal', { targetAmount });
      await loadDashboardData({ refresh: true });
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      setWarningMsg(toErrorMessage(error, 'Không thể cập nhật mục tiêu tiết kiệm.'));
    } finally {
      setIsSavingsSubmitting(false);
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
          <button type="button" className="wallet-icon-btn"><i className="bi bi-shield-check"></i></button>
          <button type="button" className="wallet-icon-btn"><i className="bi bi-bell"></i></button>
          <button type="button" className="wallet-logout-top-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            Đăng xuất
          </button>
          <div className="wallet-user-pill dropdown">
            <button className="wallet-user-btn" data-bs-toggle="dropdown" type="button">
              <img
                src="/images/img/avt.jpg"
                alt="Avatar"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/36';
                }}
              />
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
              <li><Link className="dropdown-item" to="/profile">Ho so</Link></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item text-danger" onClick={handleLogout}>Đăng xuất</button></li>
            </ul>
          </div>
        </div>
      </header>

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

        <section className="wallet-welcome-row wallet-fade-up">
          <div>
            <p className="wallet-welcome-eyebrow">Chào mừng quay lại</p>
            <h1>Xin chào, {firstName}</h1>
            <p className="wallet-welcome-sub">Chúc 1 ngày mới tốt lành.</p>
          </div>
          <div className="wallet-chip-group">
            <span className={`wallet-chip ${monthlyInsights.net >= 0 ? 'positive' : ''}`}>
              {monthlyInsights.net >= 0 ? '+' : '-'}{Math.abs(monthlyInsights.net).toLocaleString('vi-VN')} VND
            </span>
            <span className="wallet-chip">
              {savingsData?.accountNumber ? `Mục tiêu ${monthlyInsights.goalProgress}%` : 'Chưa mở tiết kiệm'}
            </span>
          </div>
        </section>

        <section className="wallet-insight-grid wallet-fade-up wallet-delay-1">
          <article className="wallet-insight-card">
            <span className="wallet-insight-icon in"><i className="bi bi-arrow-down-circle"></i></span>
            <div>
              <small>Tiền vào tháng này</small>
              <strong>{formatVnd(monthlyInsights.incoming)}</strong>
            </div>
          </article>
          <article className="wallet-insight-card">
            <span className="wallet-insight-icon out"><i className="bi bi-arrow-up-circle"></i></span>
            <div>
              <small>Tiền ra tháng này</small>
              <strong>{formatVnd(monthlyInsights.outgoing)}</strong>
            </div>
          </article>
          <article className="wallet-insight-card">
            <span className="wallet-insight-icon neutral"><i className="bi bi-wallet2"></i></span>
            <div>
              <small>Ngân sách còn lại</small>
              <strong>{formatVnd(monthlyInsights.budget - monthlyInsights.outgoing)}</strong>
            </div>
          </article>
        </section>

        <section className="wallet-grid">
          <div className="wallet-left-col">
            <article className="wallet-balance-card wallet-fade-up wallet-delay-2">
              <div className="wallet-balance-main">
                <p className="wallet-label">SỐ DƯ KHẢ DỤNG</p>
                <h2>
                  {(walletData?.balance || 0).toLocaleString('vi-VN')}
                  <span>VND</span>
                </h2>
                <p className="wallet-subtle">Ẩn</p>
                <div className="wallet-balance-actions">
                  <Link to="/topup" className="wallet-btn wallet-btn-primary"><i className="bi bi-plus-circle me-1"></i>Nạp tiền</Link>
                  <Link to="/transfer" className="wallet-btn wallet-btn-outline"><i className="bi bi-send me-1"></i>Chuyển tiền</Link>
                  <button type="button" className="wallet-btn wallet-btn-ghost"><i className="bi bi-lock me-1"></i>Nhập mã PIN</button>
                </div>
              </div>
              <div className="wallet-balance-art">
                <span className="wallet-primary-tag">Tài khoản chính</span>
                <div className="wallet-card-ghost"></div>
              </div>
            </article>

            <article className="wallet-goal-card wallet-fade-up wallet-delay-3">
              <div className="wallet-goal-head">
                <div>
                  <h3>Mục tiêu tiết kiệm</h3>
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
              <div className="wallet-goal-foot">
                {savingsData?.accountNumber ? (
                  <small>
                    Cần thêm {Math.max(monthlyInsights.savingsGoal - monthlyInsights.currentSaving, 0).toLocaleString('vi-VN')} VND để đạt mốc
                  </small>
                ) : (
                  <small>Mở tài khoản tiết kiệm để theo dõi mục tiêu riêng, tách biệt ví thanh toán.</small>
                )}
                <button
                  type="button"
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
            </article>

            <article className="wallet-history-card wallet-fade-up wallet-delay-4">
              <div className="wallet-history-head">
                <h3>Giao dịch gần đây</h3>
                <button type="button" onClick={handleRefreshDashboard} disabled={isRefreshing}>
                  {isRefreshing ? 'Đang làm mới...' : 'Làm mới'} <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
              {txErrorMsg && <div className="alert alert-warning mx-3 mb-2 py-2">{txErrorMsg}</div>}
              <div className="wallet-history-filter">
                <button type="button" className={txFilter === 'all' ? 'active' : ''} onClick={() => setTxFilter('all')}>Tất cả</button>
                <button type="button" className={txFilter === 'in' ? 'active' : ''} onClick={() => setTxFilter('in')}>Tiền vào</button>
                <button type="button" className={txFilter === 'out' ? 'active' : ''} onClick={() => setTxFilter('out')}>Tiền ra</button>
                <button type="button" className={txFilter === 'pending' ? 'active' : ''} onClick={() => setTxFilter('pending')}>Chờ xử lý</button>
              </div>
              <div className="wallet-history-list">
                {isTransactionLoading && (
                  <div className="wallet-history-loading">Đang tải lịch sử giao dịch...</div>
                )}

                {!isTransactionLoading && filteredTransactions.map((tx) => (
                  <div className="wallet-history-item" key={tx.id}>
                    <span className={`wallet-history-icon ${tx.type === 'in' ? 'in' : tx.type === 'out' ? 'out' : 'pending'}`}>
                      <i className={`bi ${tx.type === 'in' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}></i>
                    </span>
                    <div className="wallet-history-info">
                      <strong>{tx.title}</strong>
                      <small>{tx.time}</small>
                    </div>
                    <div className="wallet-history-amount">
                      <strong className={tx.type === 'in' ? 'positive' : 'negative'}>{tx.amount}</strong>
                      <span className={`wallet-status ${tx.type === 'pending' ? 'pending' : 'done'}`}>{tx.status}</span>
                    </div>
                  </div>
                ))}

                {!isTransactionLoading && filteredTransactions.length === 0 && (
                  <div className="wallet-history-empty">Chưa có giao dịch trong bộ lọc này.</div>
                )}
              </div>

              {!isTransactionLoading && txTotalPages > 1 && (
                <div className="wallet-history-pagination">
                  <button type="button" onClick={() => handleHistoryPageChange(txPage - 1)} disabled={txPage <= 0}>Trước</button>
                  <span>Trang {txPage + 1} / {txTotalPages}</span>
                  <button type="button" onClick={() => handleHistoryPageChange(txPage + 1)} disabled={txPage >= txTotalPages - 1}>Sau</button>
                </div>
              )}
            </article>
          </div>

          <aside className="wallet-right-col">
            <article className="wallet-stats-card wallet-fade-up wallet-delay-2">
              <h4>THỐNG KÊ THÁNG NÀY</h4>
              <div className="wallet-stat-row">
                <span className="wallet-stat-icon in"><i className="bi bi-graph-up-arrow"></i></span>
                <div>
                  <small>Tổng tiền vào</small>
                  <strong>{formatVnd(monthlyInsights.incoming)}</strong>
                </div>
              </div>
              <div className="wallet-stat-row">
                <span className="wallet-stat-icon out"><i className="bi bi-graph-down-arrow"></i></span>
                <div>
                  <small>Tổng tiền ra</small>
                  <strong>{formatVnd(monthlyInsights.outgoing)}</strong>
                </div>
              </div>
              <div className="wallet-budget-meter">
                <div className="wallet-budget-head">
                  <span>Mức dùng ngân sách</span>
                  <strong>{monthlyInsights.budgetUsed}%</strong>
                </div>
                <div className="wallet-progress-bar thin">
                  <div style={{ width: `${monthlyInsights.budgetUsed}%` }}></div>
                </div>
              </div>
            </article>

            <article className="wallet-spending-card wallet-fade-up wallet-delay-3">
              <h4>PHÂN BỔ CHI TIÊU</h4>
              <div className="wallet-spending-grid">
                <div
                  className="wallet-spending-donut"
                  aria-hidden="true"
                  style={{
                    background: `conic-gradient(#6d28d9 0 ${spendingSplit.housing}%, #3b82f6 ${spendingSplit.housing}% ${spendingSplit.housing + spendingSplit.transfer}%, #f59e0b ${spendingSplit.housing + spendingSplit.transfer}% 100%)`,
                  }}
                ></div>
                <div className="wallet-spending-legend">
                  <p><span className="dot housing"></span>Sinh hoạt <strong>{spendingSplit.housing}%</strong></p>
                  <p><span className="dot transfer"></span>Chuyển khoản <strong>{spendingSplit.transfer}%</strong></p>
                  <p><span className="dot shopping"></span>Mua sắm <strong>{spendingSplit.shopping}%</strong></p>
                </div>
              </div>
            </article>

            <article className="wallet-actions-card wallet-fade-up wallet-delay-4">
              <h4>THAO TÁC NHANH</h4>
              <div className="wallet-quick-grid">
                <button type="button"><i className="bi bi-lightning-charge"></i><span>Thanh toán hóa đơn</span></button>
                <button type="button"><i className="bi bi-phone"></i><span>Nạp điện thoại</span></button>
                <button type="button"><i className="bi bi-repeat"></i><span>Lặp giao dịch</span></button>
                <button type="button"><i className="bi bi-piggy-bank"></i><span>Tiết kiệm tự động</span></button>
              </div>
            </article>

            <article className="wallet-recent-receivers wallet-fade-up wallet-delay-4">
              <h4>NGƯỜI NHẬN GẦN ĐÂY</h4>
              <div className="wallet-receiver-list">
                {recentReceivers.map((receiver) => (
                  <div className="wallet-receiver-item" key={receiver.relatedParty}>
                    <img src={`https://i.pravatar.cc/40?u=${encodeURIComponent(receiver.avatarSeed)}`} alt={receiver.label} />
                    <span>{receiver.label}</span>
                  </div>
                ))}
                {recentReceivers.length === 0 && <p className="text-muted mb-0">Chưa có người nhận gần đây.</p>}
                <div className="wallet-receiver-item add">
                  <button type="button"><i className="bi bi-plus"></i></button>
                </div>
              </div>
            </article>

            <article className="wallet-security-ops wallet-fade-up wallet-delay-5">
              <h4>BẢO MẬT TÀI KHOẢN</h4>
              <button type="button" className={isWalletLocked ? 'danger' : ''} onClick={toggleWalletLock}>
                <i className={`bi ${isWalletLocked ? 'bi-unlock' : 'bi-lock'}`}></i>
                {isWalletLocked ? 'Mở khóa ví' : 'Khóa ví tạm thời'}
              </button>
              <small>{isWalletLocked ? 'Ví đang khóa tạm thời, chỉ cho phép xem số dư.' : 'Bạn có thể khóa nhanh ví khi nghi ngờ rủi ro.'}</small>
            </article>
          </aside>
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2024 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default CustomerDashboard;
