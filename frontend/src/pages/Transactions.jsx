import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WalletTopbar from '../components/WalletTopbar';
import { useToast } from '../context/ToastContext';
import { parseApiErrorMessage } from '../utils/httpError';
import '../css/dashboard.css';

const formatVnd = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')} VND`;

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

  return parseApiErrorMessage(error, fallbackMessage);
};

const extractTxDate = (tx) => {
  const candidates = [tx?.transactionDate, tx?.createdAt, tx?.createdDate, tx?.time];
  for (const item of candidates) {
    if (!item) continue;
    const dt = new Date(item);
    if (!Number.isNaN(dt.getTime())) {
      return dt;
    }
  }

  const code = String(tx?.transactionCode || '');
  const compactDateMatch = code.match(/(\d{8})/);
  if (compactDateMatch) {
    const yyyymmdd = compactDateMatch[1];
    const year = Number(yyyymmdd.slice(0, 4));
    const month = Number(yyyymmdd.slice(4, 6));
    const day = Number(yyyymmdd.slice(6, 8));
    if (year >= 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
};

const normalizeDateInput = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  const yyyyMmDdMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyyMmDdMatch) {
    return text;
  }

  const ddMmYyyyMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddMmYyyyMatch) {
    const day = ddMmYyyyMatch[1].padStart(2, '0');
    const month = ddMmYyyyMatch[2].padStart(2, '0');
    const year = ddMmYyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  return '';
};

const escapeCsvCell = (value) => {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const normalizeFilterType = (value) => {
  const allowed = ['all', 'in', 'out', 'pending'];
  return allowed.includes(value) ? value : 'all';
};

const normalizeSortBy = (value) => {
  const allowed = ['newest', 'oldest', 'amountAsc', 'amountDesc'];
  return allowed.includes(value) ? value : 'newest';
};

const getStatusTone = (rawStatus) => {
  if (rawStatus === 'PENDING') return 'pending';
  if (rawStatus === 'FAILED') return 'failed';
  return 'done';
};

const mapTxToDisplay = (tx, index) => {
  const amountNumber = Number(tx.amount || 0);
  const txKind = String(tx.type || '').toUpperCase() === 'IN' ? 'in' : 'out';
  const isPending = String(tx.status || '').toUpperCase() !== 'SUCCESS';
  const type = isPending ? 'pending' : txKind;
  const absAmount = Math.abs(amountNumber);
  const signedAmount = `${amountNumber >= 0 ? '+' : '-'}${formatVnd(absAmount)}`;
  const txDate = extractTxDate(tx);

  return {
    id: tx.transactionCode || `${tx.relatedParty || 'tx'}-${index}`,
    transactionCode: tx.transactionCode || '',
    title: tx.description || (txKind === 'in' ? `Nhận từ ${tx.relatedParty || 'không xác định'}` : `Chuyển đến ${tx.relatedParty || 'không xác định'}`),
    time: tx.transactionCode ? `Mã ${tx.transactionCode}` : 'Giao dịch đã ghi nhận',
    amount: signedAmount,
    rawAmount: amountNumber,
    rawAmountAbs: absAmount,
    rawDate: txDate,
    rawDateLabel: txDate ? txDate.toLocaleString('vi-VN') : '--',
    rawRelatedParty: tx.relatedParty || '',
    status: normalizeTxStatus(tx.status),
    rawStatus: String(tx.status || '').toUpperCase(),
    type,
  };
};

const applyTransactionFilters = ({ transactions, txFilter, keyword, fromDate, toDate, minAmountInput, maxAmountInput, sortBy }) => {
  const loweredKeyword = keyword.trim().toLowerCase();
  const minAmount = minAmountInput.trim() ? Number(minAmountInput) : null;
  const maxAmount = maxAmountInput.trim() ? Number(maxAmountInput) : null;

  let list = transactions.filter((tx) => {
    if (txFilter !== 'all' && tx.type !== txFilter) return false;

    if (loweredKeyword) {
      const haystack = `${tx.title} ${tx.transactionCode} ${tx.rawRelatedParty} ${tx.status}`.toLowerCase();
      if (!haystack.includes(loweredKeyword)) return false;
    }

    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);
      if (!tx.rawDate || tx.rawDate < from) return false;
    }

    if (toDate) {
      const to = new Date(`${toDate}T23:59:59.999`);
      if (!tx.rawDate || tx.rawDate > to) return false;
    }

    if (Number.isFinite(minAmount) && minAmount !== null && tx.rawAmountAbs < minAmount) return false;
    if (Number.isFinite(maxAmount) && maxAmount !== null && tx.rawAmountAbs > maxAmount) return false;

    return true;
  });

  list = [...list].sort((a, b) => {
    const timeA = a.rawDate ? a.rawDate.getTime() : 0;
    const timeB = b.rawDate ? b.rawDate.getTime() : 0;
    if (sortBy === 'oldest') return timeA - timeB;
    if (sortBy === 'amountAsc') return a.rawAmountAbs - b.rawAmountAbs;
    if (sortBy === 'amountDesc') return b.rawAmountAbs - a.rawAmountAbs;
    return timeB - timeA;
  });

  return list;
};

const buildFilterIssue = ({ fromDate, toDate, minAmountInput, maxAmountInput }) => {
  if (fromDate && toDate) {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T23:59:59.999`);
    if (from > to) {
      return 'Ngày bắt đầu không thể lớn hơn ngày kết thúc.';
    }
  }

  const minAmount = minAmountInput.trim() ? Number(minAmountInput) : null;
  const maxAmount = maxAmountInput.trim() ? Number(maxAmountInput) : null;
  if (minAmount !== null && !Number.isFinite(minAmount)) {
    return 'Giá trị "Tiền từ" không hợp lệ.';
  }
  if (maxAmount !== null && !Number.isFinite(maxAmount)) {
    return 'Giá trị "Tiền đến" không hợp lệ.';
  }
  if (minAmount !== null && minAmount < 0) {
    return 'Giá trị "Tiền từ" phải lớn hơn hoặc bằng 0.';
  }
  if (maxAmount !== null && maxAmount < 0) {
    return 'Giá trị "Tiền đến" phải lớn hơn hoặc bằng 0.';
  }
  if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
    return '"Tiền từ" không thể lớn hơn "Tiền đến".';
  }

  return '';
};

const Transactions = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [txErrorMsg, setTxErrorMsg] = useState('');
  const [activeAccountNumber, setActiveAccountNumber] = useState('');
  const [transactionRows, setTransactionRows] = useState([]);
  const [txPage, setTxPage] = useState(0);
  const [txFilter, setTxFilter] = useState(() => normalizeFilterType(searchParams.get('type') || 'all'));
  const [searchKeyword, setSearchKeyword] = useState(() => searchParams.get('q') || '');
  const [fromDate, setFromDate] = useState(() => normalizeDateInput(searchParams.get('from') || ''));
  const [toDate, setToDate] = useState(() => normalizeDateInput(searchParams.get('to') || ''));
  const [minAmountInput, setMinAmountInput] = useState(() => searchParams.get('min') || '');
  const [maxAmountInput, setMaxAmountInput] = useState(() => searchParams.get('max') || '');
  const [sortBy, setSortBy] = useState(() => normalizeSortBy(searchParams.get('sort') || 'newest'));
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const TX_PAGE_SIZE = 10;

  const recentTransactions = useMemo(() => transactionRows.map(mapTxToDisplay), [transactionRows]);

  const filterIssue = useMemo(
    () => buildFilterIssue({ fromDate, toDate, minAmountInput, maxAmountInput }),
    [fromDate, toDate, minAmountInput, maxAmountInput],
  );

  const filteredTransactions = useMemo(() => {
    if (filterIssue) {
      return [];
    }

    return applyTransactionFilters({
      transactions: recentTransactions,
      txFilter,
      keyword: searchKeyword,
      fromDate,
      toDate,
      minAmountInput,
      maxAmountInput,
      sortBy,
    });
  }, [recentTransactions, txFilter, searchKeyword, fromDate, toDate, minAmountInput, maxAmountInput, sortBy, filterIssue]);

  const txTotalPages = useMemo(
    () => Math.max(Math.ceil(filteredTransactions.length / TX_PAGE_SIZE), 1),
    [filteredTransactions.length],
  );

  const pagedTransactions = useMemo(() => {
    const start = txPage * TX_PAGE_SIZE;
    return filteredTransactions.slice(start, start + TX_PAGE_SIZE);
  }, [filteredTransactions, txPage]);

  const transactionSummary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        acc.total += 1;
        if (tx.type === 'in') {
          acc.incomingCount += 1;
          acc.incomingAmount += tx.rawAmountAbs;
        } else if (tx.type === 'out') {
          acc.outgoingCount += 1;
          acc.outgoingAmount += tx.rawAmountAbs;
        } else {
          acc.pendingCount += 1;
          acc.pendingAmount += tx.rawAmountAbs;
        }
        return acc;
      },
      {
        total: 0,
        incomingCount: 0,
        outgoingCount: 0,
        pendingCount: 0,
        incomingAmount: 0,
        outgoingAmount: 0,
        pendingAmount: 0,
      },
    );
  }, [filteredTransactions]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (txFilter !== 'all') params.set('type', txFilter);
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (minAmountInput.trim()) params.set('min', minAmountInput.trim());
    if (maxAmountInput.trim()) params.set('max', maxAmountInput.trim());
    if (sortBy !== 'newest') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [txFilter, searchKeyword, fromDate, toDate, minAmountInput, maxAmountInput, sortBy, setSearchParams]);

  useEffect(() => {
    setTxPage(0);
  }, [txFilter, searchKeyword, fromDate, toDate, minAmountInput, maxAmountInput, sortBy]);

  useEffect(() => {
    if (txPage >= txTotalPages) {
      setTxPage(Math.max(txTotalPages - 1, 0));
    }
  }, [txPage, txTotalPages]);

  const handleResetFilters = () => {
    setTxFilter('all');
    setSearchKeyword('');
    setFromDate('');
    setToDate('');
    setMinAmountInput('');
    setMaxAmountInput('');
    setSortBy('newest');
    setTxPage(0);
  };

  const fetchAllTransactionRows = async (accountNumber) => {
    const size = 100;
    let page = 0;
    let totalPages = 1;
    const rows = [];

    while (page < totalPages) {
      const response = await api.get(`/api/transactions/history/${accountNumber}`, {
        params: { page, size },
      });

      const pageRows = response.data?.content || [];
      rows.push(...pageRows);
      totalPages = Math.max(response.data?.totalPages || 1, 1);
      page += 1;
    }

    return rows;
  };

  const handleExportCsv = async () => {
    if (!activeAccountNumber) {
      toast.info('Không tìm thấy tài khoản để xuất CSV.');
      return;
    }

    if (filterIssue) {
      toast.info(filterIssue);
      return;
    }

    setIsExportingCsv(true);

    try {
      const filteredAll = filteredTransactions;

      if (filteredAll.length === 0) {
        toast.info('Không có giao dịch để xuất CSV theo bộ lọc hiện tại.');
        return;
      }

      const header = ['Mã giao dịch', 'Mô tả', 'Đối tác', 'Loại', 'Trạng thái', 'Số tiền', 'Thời gian'];
      const rows = filteredAll.map((tx) => [
        tx.transactionCode || tx.id,
        tx.title,
        tx.rawRelatedParty || '--',
        tx.type,
        tx.status,
        tx.rawAmount,
        tx.rawDateLabel,
      ]);

      const csv = [header, ...rows]
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
        .join('\n');

      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Xuất CSV thành công (${filteredAll.length} giao dịch).`);
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      toast.error(toErrorMessage(error, 'Không thể xuất CSV lúc này.'));
    } finally {
      setIsExportingCsv(false);
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

  const loadAllTransactionData = async ({ accountNumber, silent = false }) => {
    if (!accountNumber) {
      setTransactionRows([]);
      setTxPage(0);
      return;
    }

    if (!silent) {
      setIsTransactionLoading(true);
    }

    setTxErrorMsg('');

    try {
      const allRows = await fetchAllTransactionRows(accountNumber);
      setTransactionRows(allRows);
      setTxPage(0);
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;

      setTxErrorMsg(toErrorMessage(error, 'Không thể tải lịch sử giao dịch.'));
      toast.error(toErrorMessage(error, 'Không thể tải lịch sử giao dịch.'));
      setTransactionRows([]);
      setTxPage(0);
    } finally {
      if (!silent) {
        setIsTransactionLoading(false);
      }
    }
  };

  const loadTransactionsData = async ({ refresh = false } = {}) => {
    if (!refresh) {
      setIsLoading(true);
    }

    setErrorMsg('');

    try {
      let accountNumber = '';

      try {
        const primaryAccountResponse = await api.get('/api/accounts/my-account');
        accountNumber = primaryAccountResponse.data?.accountNumber || '';
      } catch (primaryError) {
        const isHandled = await handleAuthNavigation(primaryError);
        if (isHandled) return;

        const accountListResponse = await api.get('/api/accounts/my-accounts');
        accountNumber = accountListResponse.data?.[0]?.accountNumber || '';
      }

      setActiveAccountNumber(accountNumber);

      if (!accountNumber) {
        setErrorMsg('Bạn chưa có tài khoản ví khả dụng.');
        setTransactionRows([]);
        setTxPage(0);
      } else {
        await loadAllTransactionData({ accountNumber, silent: refresh });
      }
    } catch (error) {
      const isHandled = await handleAuthNavigation(error);
      if (isHandled) return;
      setErrorMsg(toErrorMessage(error, 'Không thể tải dữ liệu lịch sử giao dịch.'));
      toast.error(toErrorMessage(error, 'Không thể tải dữ liệu lịch sử giao dịch.'));
    } finally {
      if (!refresh) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTransactionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout, navigate]);

  const handleHistoryPageChange = async (nextPage) => {
    if (nextPage < 0 || nextPage >= txTotalPages || nextPage === txPage || !activeAccountNumber) {
      return;
    }

    setTxPage(nextPage);
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
        <section className="wallet-transactions-wrap wallet-fade-up">
          <div className="wallet-transactions-hero">
            <div className="wallet-transactions-head">
              <div className="wallet-transactions-head-content">
                <h1>Lịch sử giao dịch</h1>
                <p>Theo dõi mọi khoản tiền vào, tiền ra và trạng thái xử lý theo bộ lọc bạn chọn.</p>
              </div>
              <div className="wallet-transactions-head-actions">
                <button type="button" className="wallet-transactions-ghost-btn" onClick={() => loadTransactionsData({ refresh: true })}>
                  Làm mới <i className="bi bi-arrow-clockwise"></i>
                </button>
                <button
                  type="button"
                  className="wallet-transactions-primary-btn"
                  onClick={handleExportCsv}
                  disabled={isExportingCsv}
                >
                  {isExportingCsv ? 'Đang xuất...' : 'Xuất CSV'}
                </button>
              </div>
            </div>

            <div className="wallet-transactions-kpis">
              <article className="wallet-transactions-kpi">
                <small>Tổng giao dịch lọc được</small>
                <strong>{transactionSummary.total}</strong>
              </article>
              <article className="wallet-transactions-kpi income">
                <small>Tiền vào</small>
                <strong>{formatVnd(transactionSummary.incomingAmount)}</strong>
                <span>{transactionSummary.incomingCount} giao dịch</span>
              </article>
              <article className="wallet-transactions-kpi expense">
                <small>Tiền ra</small>
                <strong>{formatVnd(transactionSummary.outgoingAmount)}</strong>
                <span>{transactionSummary.outgoingCount} giao dịch</span>
              </article>
              <article className="wallet-transactions-kpi pending">
                <small>Đang chờ xử lý</small>
                <strong>{transactionSummary.pendingCount}</strong>
                <span>{formatVnd(transactionSummary.pendingAmount)}</span>
              </article>
            </div>
          </div>

          {errorMsg && <div className="alert alert-danger mb-3">{errorMsg}</div>}
          {txErrorMsg && <div className="alert alert-warning mb-3">{txErrorMsg}</div>}
          {filterIssue && <div className="alert alert-warning mb-3">{filterIssue}</div>}

          <article className="wallet-history-card wallet-transactions-panel">
            <div className="wallet-history-filter">
              <button type="button" className={txFilter === 'all' ? 'active' : ''} onClick={() => setTxFilter('all')}>Tất cả</button>
              <button type="button" className={txFilter === 'in' ? 'active' : ''} onClick={() => setTxFilter('in')}>Tiền vào</button>
              <button type="button" className={txFilter === 'out' ? 'active' : ''} onClick={() => setTxFilter('out')}>Tiền ra</button>
              <button type="button" className={txFilter === 'pending' ? 'active' : ''} onClick={() => setTxFilter('pending')}>Chờ xử lý</button>
            </div>

            <div className="wallet-transactions-filters-grid">
              <div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo mã GD / mô tả / đối tác"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(normalizeDateInput(e.target.value))}
                />
              </div>
              <div>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(normalizeDateInput(e.target.value))}
                />
              </div>
              <div>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  placeholder="Tiền từ"
                  value={minAmountInput}
                  onChange={(e) => setMinAmountInput(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  placeholder="Tiền đến"
                  value={maxAmountInput}
                  onChange={(e) => setMaxAmountInput(e.target.value)}
                />
              </div>
            </div>

            <div className="wallet-transactions-filter-actions">
              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="amountDesc">Số tiền giảm dần</option>
                <option value="amountAsc">Số tiền tăng dần</option>
              </select>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleResetFilters}>
                Reset bộ lọc
              </button>
              <span className="wallet-transactions-fit-text">{filteredTransactions.length} giao dịch phù hợp</span>
            </div>

            <div className="wallet-history-list">
              {isTransactionLoading && (
                <div className="wallet-history-loading">Đang tải lịch sử giao dịch...</div>
              )}

              {!isTransactionLoading && pagedTransactions.map((tx) => (
                <div className="wallet-history-item" key={tx.id}>
                  <span className={`wallet-history-icon ${tx.type === 'in' ? 'in' : tx.type === 'out' ? 'out' : 'pending'}`}>
                    <i
                      className={`bi ${
                        tx.type === 'in' ? 'bi-arrow-down-left' : tx.type === 'out' ? 'bi-arrow-up-right' : 'bi-hourglass-split'
                      }`}
                    ></i>
                  </span>
                  <div className="wallet-history-info">
                    <strong>{tx.title}</strong>
                    <small>{tx.rawDateLabel} • {tx.time}</small>
                  </div>
                  <div className="wallet-history-amount">
                    <strong className={tx.type === 'in' ? 'positive' : tx.type === 'out' ? 'negative' : ''}>{tx.amount}</strong>
                    <span className={`wallet-status ${getStatusTone(tx.rawStatus)}`}>{tx.status}</span>
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
        </section>
      </main>

      <footer className="wallet-footer">
        <p>© 2026 NovaPay. Bảo mật và an toàn giao dịch.</p>
        <span>Điều khoản   Chính sách bảo mật   Hỗ trợ (1900 xxxx)</span>
      </footer>
    </div>
  );
};

export default Transactions;
