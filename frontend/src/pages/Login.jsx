import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/users/login', { 
                username: username, 
                password: password 
            });
            
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            
            navigate('/dashboard');
            
        } catch (error) {
            if (error.response && error.response.data) {
                setErrorMsg(error.response.data.error || typeof error.response.data === 'string' ? error.response.data : "Đăng nhập thất bại");
            } else {
                setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-soft-purple d-flex align-items-center justify-content-center vh-100 vw-100" >
            <div className="auth-card">
                <div className="auth-logo">N</div>
                
                <div className="text-center mb-4">
                    <h3 className="fw-bold text-dark">Đăng nhập</h3>
                    <p className="text-muted small">Chào mừng bạn quay trở lại với NovaPay</p>
                </div>

                {/* Hiển thị thông báo lỗi nếu có */}
                {errorMsg && (
                    <div className="alert alert-danger py-2 text-center small mb-3">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Tài khoản</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 rounded-start-3 ps-3">
                                <i className="bi bi-person text-purple"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control form-control-lg bg-light border-start-0 rounded-end-3 ps-0" 
                                placeholder="Tên đăng nhập" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Mật khẩu</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 rounded-start-3 ps-3">
                                <i className="bi bi-lock text-purple"></i>
                            </span>
                            <input 
                                type="password" 
                                className="form-control form-control-lg bg-light border-start-0 rounded-end-3 ps-0" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="rememberMe" />
                            <label className="form-check-label small text-muted cursor-pointer" htmlFor="rememberMe">Ghi nhớ</label>
                        </div>
                        <Link to="/forgot-password" className="text-decoration-none small fw-bold text-purple">Quên mật khẩu?</Link>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary-custom w-100 py-3 rounded-3 fw-bold shadow"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
                    </button>
                </form>

                <p className="text-center mt-4 mb-0 text-muted small">
                    Chưa có ví NovaPay? <Link to="/register" className="fw-bold text-decoration-none text-purple ms-1">Tạo ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;