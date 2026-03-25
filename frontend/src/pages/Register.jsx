import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseApiErrorMessage } from '../utils/httpError';
import '../css/auth.css';

const Register = () => {
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState({
        fullName: '',
        idCard: '',
        dateOfBirth: '',
        phoneNumber: '',
        email: '',
        address: '',
        gender: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Bắt sự kiện người dùng gõ phím
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNextStep = () => {
        setStep(2);
        setErrorMsg('');
    };

    const handleBackStep = () => {
        setStep(1);
        setErrorMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setErrorMsg("Mật khẩu xác nhận không khớp!");
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        try {
            await axios.post('/api/users/register', formData);
            alert('Đăng ký thành công! Đang chuyển về trang đăng nhập...');
            navigate('/login');
        } catch (error) {
            setErrorMsg(parseApiErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100">
            <div className="row g-0 min-vh-100">
                <div className="col-lg-6 d-none d-lg-flex flex-column bg-branding text-white p-5 justify-content-between">
                    <div className="branding-header">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="logo-circle mx-0">N</div>
                            <h1 className="fw-bold m-0">NovaPay</h1>
                        </div>
                    </div>

                    <div className="branding-image my-5 text-center">
                        <img 
                            src="/images/img/cardts.png" 
                            alt="NovaPay Illustration" 
                            className="img-fluid floating-img" 
                            style={{ maxWidth: '50%', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
                            onError={(e) => {e.target.style.display = 'none'}}
                        />
                    </div>

                    <div className="branding-features d-flex gap-4 mt-auto">
                        <div className="feature-item">
                            <i className="bi bi-shield-check fs-3 text-warning mb-2 d-block"></i>
                            <span className="fw-bold d-block">An toàn 100%</span>
                            <small className="opacity-75">Bảo mật đa lớp</small>
                        </div>
                        <div className="feature-item">
                            <i className="bi bi-lightning-charge fs-3 text-info mb-2 d-block"></i>
                            <span className="fw-bold d-block">Siêu tốc</span>
                            <small className="opacity-75">Giao dịch tức thì</small>
                        </div>
                        <div className="feature-item">
                            <i className="bi bi-gift fs-3 text-danger mb-2 d-block"></i>
                            <span className="fw-bold d-block">Nhiều ưu đãi</span>
                            <small className="opacity-75">Dành cho mọi người</small>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Form đăng ký */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white py-5">
                    <div className="register-box px-4 px-md-5 w-100" style={{ maxWidth: '600px' }}>
                        
                        <div className="d-lg-none text-center mb-4">
                            <h2 className="fw-bold text-primary-custom">NovaPay</h2>
                        </div>

                        <div className="mb-4">
                            <h2 className="fw-bold">Đăng ký tài khoản</h2>
                            <p className="text-muted">
                                {step === 1 ? 'Nhập thông tin cá nhân của bạn' : 'Thiết lập thông tin bảo mật'}
                            </p>
                            
                            <div className="progress" style={{ height: '4px' }}>
                                <div 
                                    className="progress-bar bg-primary-custom" 
                                    role="progressbar" 
                                    style={{ width: step === 1 ? '50%' : '100%', transition: 'width 0.4s ease' }}
                                ></div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="alert alert-danger py-2 small mb-3 text-center">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit}>
                            
                            {/* BƯỚC 1: THÔNG TIN CÁ NHÂN */}
                            {step === 1 && (
                                <div id="step1" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold small">Họ và tên</label>
                                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="Họ và tên" required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold small">Giới tính</label>
                                            <select name="gender" value={formData.gender} onChange={handleChange} className="form-select form-control-lg bg-light border-0" required>
                                                <option value="">Chọn giới tính</option>
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                                <option value="Khác">Khác</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">CCCD/CMND</label>
                                        <input type="text" name="idCard" value={formData.idCard} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="CCCD" required />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold small">Ngày sinh</label>
                                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="form-control form-control-lg bg-light border-0" required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold small">Số điện thoại</label>
                                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="09xxxxxxxxx" required />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">Địa chỉ Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="a@email.com" required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Địa chỉ thường trú</label>
                                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="Số nhà, Tên đường, Quận/Huyện..." required />
                                    </div>

                                    <button type="submit" className="btn btn-primary-custom w-100 py-3 rounded-3 fw-bold shadow">
                                        Tiếp tục <i className="bi bi-arrow-right ms-2"></i>
                                    </button>
                                </div>
                            )}

                            {/* BƯỚC 2: TÀI KHOẢN & MẬT KHẨU */}
                            {step === 2 && (
                                <div id="step2" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">Tên đăng nhập (Username)</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="user123" required />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">Mật khẩu</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="••••••••" required />
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Xác nhận mật khẩu</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-control form-control-lg bg-light border-0" placeholder="••••••••" required />
                                    </div>

                                    <div className="d-flex gap-3">
                                        <button type="button" onClick={handleBackStep} className="btn btn-light w-50 py-3 rounded-3 fw-bold text-muted">
                                            Quay lại
                                        </button>
                                        <button type="submit" disabled={isLoading} className="btn btn-primary-custom w-50 py-3 rounded-3 fw-bold shadow">
                                            {isLoading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </form>

                        <p className="text-center mt-4 text-muted small">
                            Đã có tài khoản? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: 'var(--primary-color)' }}>Đăng nhập</Link>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;