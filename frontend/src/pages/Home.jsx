import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    // Đảm bảo Bootstrap JS hoạt động cho navbar collapse
    useEffect(() => {
        const bootstrapScript = document.createElement('script');
        bootstrapScript.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js";
        bootstrapScript.async = true;
        document.body.appendChild(bootstrapScript);

        return () => {
            document.body.removeChild(bootstrapScript);
        };
    }, []);

    return (
        <>
            {/* 1. NAVBAR - Đã tinh chỉnh class khớp CSS */}
            <nav className="navbar navbar-expand-lg fixed-top bg-white">
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
                        <div className="logo-icon">N</div>
                        <span className="brand-text">NovaPay</span>
                    </Link>
                    
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="mainNav">
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item"><a className="nav-link" href="#features">Tính năng</a></li>
                            <li className="nav-item"><a className="nav-link" href="#security">Bảo mật</a></li>
                            <li className="nav-item"><a className="nav-link" href="#fees">Biểu phí</a></li>
                        </ul>
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-outline-custom me-2">Đăng nhập</Link>
                            <Link to="/register" className="btn btn-primary-custom">Đăng ký ngay</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* 2. HERO SECTION - Đã tinh chỉnh class khớp CSS */}
            <header className="hero-section">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 hero-text">
                            <span className="badge-custom">Ví điện tử số 1 cho mọi người</span>
                            <h1>Thanh toán mọi thứ<br/>chỉ trong <span className="highlight">1 chạm</span></h1>
                            <p>Chuyển tiền miễn phí, nạp thẻ điện thoại và quản lý chi tiêu thông minh cùng NovaPay.</p>
                            
                            <div className="d-flex gap-3 mt-4">
                                <Link to="/register" className="btn btn-primary-custom btn-lg">Mở ví miễn phí</Link>
                                <a href="#" className="btn btn-primary-custom btn-lg border"><i className="bi bi-play-circle me-2"></i>Xem Demo</a>
                            </div>
                            
                            <div className="stats-row mt-5 d-flex gap-4">
                                <div>
                                    <h4>50K+</h4>
                                    <small>Người dùng</small>
                                </div>
                                <div className="vr"></div>
                                <div>
                                    <h4>24/7</h4>
                                    <small>Hỗ trợ</small>
                                </div>
                                <div className="vr"></div>
                                <div>
                                    <h4>100%</h4>
                                    <small>Bảo mật</small>
                                </div>
                            </div>
                        </div>
                        {/* Khu vực ảnh Hero bên phải */}
                        <div className="col-lg-6 d-none d-lg-block text-center floating-img">
                             <img src="/images/hero-mockup.png" alt="NovaPay App" className="img-fluid" style={{maxHeight: '500px'}} onError={(e) => {e.target.style.display = 'none'}}/>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. FEATURES SECTION - Đã tinh chỉnh class khớp CSS */}
            <section id="features" className="section-padding">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="section-title fw-bold">Tại sao chọn NovaPay?</h2>
                        <p className="text-muted">Giải pháp tài chính toàn diện cho cuộc sống hiện đại</p>
                    </div>
                    
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="feature-box">
                                <div className="icon-box bg-purple-light text-purple">
                                    <i className="bi bi-lightning-charge-fill"></i>
                                </div>
                                <h3>Thanh toán đa dịch vụ</h3>
                                <p>Hỗ trợ thanh toán điện, nước, internet và nạp thẻ điện thoại tự động chỉ với vài thao tác.</p>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            <div className="feature-box">
                                <div className="icon-box bg-pink-light text-pink">
                                    <i className="bi bi-shield-check"></i>
                                </div>
                                <h3>Tích điểm hoàn tiền</h3>
                                <p>Nhận hoàn tiền lên đến 5% cho mỗi giao dịch và quy đổi điểm thưởng thành các voucher giảm giá.</p>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            <div className="feature-box">
                                <div className="icon-box bg-blue-light text-blue">
                                    <i className="bi bi-graph-up-arrow"></i>
                                </div>
                                <h3>Quản lý chi tiêu</h3>
                                <p>Tự động thống kê thu chi hàng tháng giúp bạn kiểm soát tài chính cá nhân hiệu quả.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. FOOTER - Đã tinh chỉnh class khớp CSS */}
            <footer className="footer-custom">
                <div className="container text-center">
                    <p className="mb-0">© 2026 NovaPay</p>
                </div>
            </footer>
        </>
    );
};

export default Home;