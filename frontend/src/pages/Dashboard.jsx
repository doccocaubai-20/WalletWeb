import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import '../css/dashboard.css';
const Dashboard = () => {
    const navigate = useNavigate();
    
    const [walletData, setWalletData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarToggled, setIsSidebarToggled] = useState(false);
    
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Lấy thông tin ví
    useEffect(() => {
        const fetchWalletInfo = async () => {
            let currentToken = localStorage.getItem('accessToken');
            if (!currentToken) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get('/api/accounts/my-account', {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });
                setWalletData(response.data);
                setIsLoading(false);
            } catch (err) {
                if (err.response && err.response.status === 401) {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        try {
                            const refreshRes = await axios.post('/api/users/refresh', { refreshToken });
                            const newAccessToken = refreshRes.data.accessToken;
                            localStorage.setItem('accessToken', newAccessToken);
                            
                            const retryResponse = await axios.get('/api/accounts/my-account', {
                                headers: { 'Authorization': `Bearer ${newAccessToken}` }
                            });
                            setWalletData(retryResponse.data);
                            setIsLoading(false);
                        } catch (refreshErr) {
                            localStorage.clear();
                            navigate('/login');
                        }
                    } else {
                        localStorage.clear();
                        navigate('/login');
                    }
                } else {
                    setIsLoading(false);
                }
            }
        };

        fetchWalletInfo();
    }, [navigate]);

    // Vẽ biểu đồ
    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
                    datasets: [
                        { label: 'Tiền vào', data: [120, 190, 30, 150, 120, 130, 200], backgroundColor: '#6d28d9', borderRadius: 4 },
                        { label: 'Tiền ra', data: [80, 50, 60, 40, 90, 20, 100], backgroundColor: '#ff4785', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (isLoading) return <div className="text-center mt-5">Đang tải dữ liệu...</div>;

    return (
        <div className={`d-flex bg-light ${isSidebarToggled ? 'toggled' : ''}`} id="wrapper" >
            
            {/* SIDEBAR */}
            <div className="bg-white border-end shadow-sm" id="sidebar-wrapper">
                <div className="text-center py-4 fs-4 fw-bold border-bottom">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className="logo-icon-sm">N</div>
                        <span className="text-purple">NovaPay</span>
                    </div>
                </div>
                <div className="list-group list-group-flush my-3">
                    <Link to="/dashboard" className="list-group-item list-group-item-action active"><i className="bi bi-grid-fill me-2"></i>Tổng quan</Link>
                    <Link to="/transfer" className="list-group-item list-group-item-action text-secondary"><i className="bi bi-bank2 me-2"></i>Chuyển tiền</Link>
                    <a href="#" className="list-group-item list-group-item-action text-secondary"><i className="bi bi-clock-history me-2"></i>Lịch sử</a>
                    <Link to="/profile" className="list-group-item list-group-item-action text-secondary"><i className="bi bi-gear-fill me-2"></i>Cài đặt</Link>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div id="page-content-wrapper">
                
                {/* NAVBAR (Cố định bằng sticky-top) */}
                <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 border-bottom shadow-sm sticky-top" style={{ zIndex: 1020 }}>
                    <div className="d-flex align-items-center">
                        <i className="bi bi-list fs-4 me-3 cursor-pointer d-md-none" onClick={() => setIsSidebarToggled(!isSidebarToggled)}></i>
                        <h4 className="m-0 fw-bold">Tổng quan</h4>
                    </div>
                    
                    <div className="ms-auto d-flex align-items-center gap-3">
                        <div className="bg-light rounded-pill px-3 py-1 d-none d-md-flex align-items-center">
                            <i className="bi bi-search text-muted"></i>
                            <input type="text" className="border-0 bg-transparent ms-2" style={{ outline: 'none' }} placeholder="Tìm kiếm..." />
                        </div>
                        <i className="bi bi-bell fs-5 position-relative cursor-pointer">
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                        </i>
                        <div className="dropdown ms-3 border-start ps-3">
                            <div className="d-flex align-items-center gap-2 cursor-pointer" data-bs-toggle="dropdown">
                                <img src="/images/img/avt.jpg" className="rounded-circle" width="40" height="40" alt="Avatar" onError={(e) => {e.target.src = 'https://via.placeholder.com/40'}} />
                                <span className="fw-bold d-none d-md-inline">Huy Le</span>
                            </div>
                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow mt-2">
                                <li><Link className="dropdown-item" to="/profile">Hồ sơ</Link></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item text-danger" onClick={handleLogout}>Đăng xuất</button></li>
                            </ul>
                        </div>
                    </div>
                </nav>

                {/* DASHBOARD BODY */}
                <div className="container-fluid px-4 py-4">
                    
                    {/* HÀNG 1: THẺ VÍ & THAO TÁC NHANH */}
                    <div className="row g-4 mb-4">
                        <div className="col-lg-4">
                            <div className="card border-0 rounded-4 shadow-sm h-100 text-white p-4 position-relative overflow-hidden" 
                                 style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)', minHeight: '240px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <span className="fw-bold tracking-wide">NovaPay</span>
                                    <i className="bi bi-wifi fs-4 transform-rotate-90"></i>
                                </div>
                                <div>
                                    <p className="mb-0 text-white-50 small">Số dư khả dụng</p>
                                    <h2 className="fw-bold mb-0 mt-1">
                                        {walletData ? walletData.balance.toLocaleString('vi-VN') : '0'} <span className="fs-5">VND</span>
                                    </h2>
                                </div>
                                <div className="mt-auto pt-4 d-flex justify-content-between align-items-end">
                                    <div>
                                        <p className="mb-0 text-white-50 small">Số tài khoản</p>
                                        <p className="fw-bold mb-0 font-monospace tracking-wide">
                                            {walletData ? walletData.accountNumber : '**** **** ****'}
                                        </p>
                                    </div>
                                    <div className="logo-icon-sm bg-white text-purple rounded-circle">N</div>
                                </div>
                                <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: '150px', height: '150px', top: '-50px', right: '-20px' }}></div>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            <div className="bg-white rounded-4 shadow-sm p-4 h-100 d-flex flex-column justify-content-center">
                                <h5 className="fw-bold mb-4">Dịch vụ tiện ích</h5>
                                <div className="row g-3">
                                    <div className="col-4 col-md-2">
                                        <Link to="/transfer" className="text-decoration-none">
                                            <div className="border rounded-4 p-3 text-center hover-bg-light transition-all cursor-pointer h-100">
                                                <i className="bi bi-send-fill fs-3 text-primary mb-2 d-block"></i>
                                                <span className="small fw-bold text-dark">Chuyển</span>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <div className="border rounded-4 p-3 text-center hover-bg-light transition-all cursor-pointer h-100">
                                            <i className="bi bi-plus-circle-fill fs-3 text-success mb-2 d-block"></i>
                                            <span className="small fw-bold text-dark">Nạp</span>
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <div className="border rounded-4 p-3 text-center hover-bg-light transition-all cursor-pointer h-100">
                                            <i className="bi bi-box-arrow-up fs-3 text-danger mb-2 d-block"></i>
                                            <span className="small fw-bold text-dark">Rút</span>
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <div className="border rounded-4 p-3 text-center hover-bg-light transition-all cursor-pointer h-100">
                                            <i className="bi bi-qr-code-scan fs-3 text-dark mb-2 d-block"></i>
                                            <span className="small fw-bold text-dark">Quét QR</span>
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <div className="border rounded-4 p-3 text-center hover-bg-light transition-all cursor-pointer h-100">
                                            <i className="bi bi-lightning-charge-fill fs-3 text-warning mb-2 d-block"></i>
                                            <span className="small fw-bold text-dark">Hóa đơn</span>
                                        </div>
                                    </div>
                                    <div className="col-4 col-md-2">
                                        <div className="border rounded-4 p-3 text-center hover-bg-light transition-all cursor-pointer h-100 bg-light">
                                            <i className="bi bi-grid-3x3-gap-fill fs-3 text-muted mb-2 d-block"></i>
                                            <span className="small fw-bold text-muted">Tất cả</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HÀNG 2: 3 THẺ THỐNG KÊ NHỎ */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 d-flex justify-content-between align-items-center border-left-blue">
                                <div>
                                    <div className="text-muted small fw-bold mb-1">Tổng thu (Tháng)</div>
                                    <h4 className="fw-bold mb-0">+4,500,000 đ</h4>
                                </div>
                                <div className="bg-primary bg-opacity-10 text-primary rounded p-3"><i className="bi bi-arrow-down-left fs-4"></i></div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 d-flex justify-content-between align-items-center border-left-pink">
                                <div>
                                    <div className="text-muted small fw-bold mb-1">Tổng chi (Tháng)</div>
                                    <h4 className="fw-bold mb-0">-1,250,000 đ</h4>
                                </div>
                                <div className="bg-danger bg-opacity-10 text-danger rounded p-3"><i className="bi bi-arrow-up-right fs-4"></i></div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 d-flex justify-content-between align-items-center border-left-purple">
                                <div>
                                    <div className="text-muted small fw-bold mb-1">Điểm Nova Rewards</div>
                                    <h4 className="fw-bold mb-0">1,240 pts</h4>
                                </div>
                                <div className="bg-warning bg-opacity-10 text-warning rounded p-3"><i className="bi bi-star-fill fs-4"></i></div>
                            </div>
                        </div>
                    </div>

                    {/* HÀNG 3: BIỂU ĐỒ & LỊCH SỬ */}
                    <div className="row g-4">
                        <div className="col-lg-7">
                            <div className="bg-white rounded-4 shadow-sm p-4 h-100" style={{ minHeight: '300px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="fw-bold mb-0">Lưu lượng dòng tiền</h5>
                                    <select className="form-select form-select-sm w-auto border-0 bg-light fw-bold">
                                        <option>7 ngày qua</option>
                                    </select>
                                </div>
                                <div style={{ height: '200px' }}>
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5">
                            <div className="bg-white rounded-4 shadow-sm p-4 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="fw-bold mb-0">Lịch sử giao dịch</h5>
                                    <a href="#" className="text-decoration-none text-purple fw-bold small">Xem tất cả</a>
                                </div>
                                
                                <div className="timeline-scroll position-relative ms-3 border-start border-2 border-light pb-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                    <div className="position-relative mb-4 ms-4">
                                        <div className="position-absolute bg-white border border-2 border-success rounded-circle" style={{ width: '16px', height: '16px', left: '-33px', top: '5px' }}></div>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '180px' }}>Nhận tiền từ Nguyễn Văn A</h6>
                                                <p className="text-muted small mb-0">10:30 AM, Hôm nay</p>
                                            </div>
                                            <span className="fw-bold text-success">+ 2,000,000 đ</span>
                                        </div>
                                    </div>

                                    <div className="position-relative mb-4 ms-4">
                                        <div className="position-absolute bg-white border border-2 border-danger rounded-circle" style={{ width: '16px', height: '16px', left: '-33px', top: '5px' }}></div>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '180px' }}>Thanh toán Spotify Premium</h6>
                                                <p className="text-muted small mb-0">08:15 AM, Hôm qua</p>
                                            </div>
                                            <span className="fw-bold text-danger">- 59,000 đ</span>
                                        </div>
                                    </div>

                                    <div className="position-relative mb-2 ms-4">
                                        <div className="position-absolute bg-white border border-2 border-warning rounded-circle" style={{ width: '16px', height: '16px', left: '-33px', top: '5px' }}></div>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '180px' }}>Thanh toán tiền điện tháng 2</h6>
                                                <p className="text-muted small mb-0">14:00 PM, 15/03</p>
                                            </div>
                                            <span className="fw-bold text-danger">- 450,000 đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;