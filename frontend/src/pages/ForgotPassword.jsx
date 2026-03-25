import { useState } from "react";
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { parseApiErrorMessage } from '../utils/httpError';


const ForgotPassword = () => {  
    const [email , setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        if (!email.trim()) {
            setErrorMsg('Vui lòng nhập email.');
            return;
        }
    
        try {
            setIsLoading(true);
            await api.post('/api/users/forgot-password', { email });
            setIsOtpSent(true);
            setIsOtpVerified(false);
            setResetToken('');
            setOtp('');
            setSuccessMsg('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.');
        } catch (error) {
            setErrorMsg(parseApiErrorMessage(error, 'Gửi yêu cầu thất bại. Vui lòng thử lại.'));

        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!otp.trim()) {
            setErrorMsg('Vui lòng nhập mã OTP.');
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.post('/api/users/verify-otp', {
                email,
                otp,
            });

            const token = response.data?.resetToken;
            if (!token) {
                throw new Error('Không nhận được reset token từ máy chủ.');
            }

            setResetToken(token);
            setIsOtpVerified(true);
            setSuccessMsg(response.data?.message || 'Xác thực OTP thành công. Vui lòng nhập mật khẩu mới.');
        } catch (error) {
            setErrorMsg(parseApiErrorMessage(error, 'Xác thực OTP thất bại. Vui lòng thử lại.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!resetToken) {
            setErrorMsg('Phiên đặt lại mật khẩu đã hết hạn. Vui lòng xác thực OTP lại.');
            setIsOtpVerified(false);
            return;
        }

        if (!newPassword) {
            setErrorMsg('Vui lòng nhập mật khẩu mới.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.post('/api/users/reset-password', {
                resetToken,
                newPassword,
            });

            setSuccessMsg(typeof response.data === 'string' ? response.data : 'Đặt lại mật khẩu thành công.');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setErrorMsg(parseApiErrorMessage(error, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-soft-purple d-flex align-items-center justify-content-center vh-100 vw-100" >
            <div className="auth-card">
                <div className="auth-logo">N</div>
                <div className="text-center mb-4">
                    <h3 className="fw-bold text-dark">Quên mật khẩu</h3>
                    <p className="text-muted large">
                        {!isOtpSent && 'Nhập email của bạn để nhận mã OTP.'}
                        {isOtpSent && !isOtpVerified && 'Nhập OTP để xác thực trước khi đặt mật khẩu mới.'}
                        {isOtpVerified && 'OTP đã xác thực. Hãy nhập mật khẩu mới của bạn.'}
                    </p>
                </div>
                {errorMsg && (
                    <div className="alert alert-danger py-2 text-center small mb-3">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="alert alert-success py-2 text-center small mb-3">
                        {successMsg}
                    </div>
                )}

                {!isOtpSent ? (
                <form onSubmit={handleSendOtp}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary-custom w-100" disabled={isLoading}>
                        {isLoading ? 'Đang gửi...' : 'Gửi mã OTP'}
                    </button>
                </form>
                ) : !isOtpVerified ? (
                <form onSubmit={handleVerifyOtp}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            disabled
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Mã OTP</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập mã OTP 6 số"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary-custom w-100" disabled={isLoading}>
                        {isLoading ? 'Đang xác thực...' : 'Xác thực OTP'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary w-100 mt-2"
                        onClick={() => {
                            setIsOtpSent(false);
                            setIsOtpVerified(false);
                            setResetToken('');
                            setOtp('');
                            setErrorMsg('');
                            setSuccessMsg('');
                        }}
                        disabled={isLoading}
                    >
                        Gửi lại OTP
                    </button>
                </form>
                ) : (
                <form onSubmit={handleResetPassword}>
                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            disabled
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Mã OTP</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập mã OTP 6 số"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Mật khẩu mới</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Nhập mật khẩu mới"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold small text-muted">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary-custom w-100" disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary w-100 mt-2"
                        onClick={() => {
                            setIsOtpSent(false);
                            setIsOtpVerified(false);
                            setResetToken('');
                            setOtp('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setErrorMsg('');
                            setSuccessMsg('');
                        }}
                        disabled={isLoading}
                    >
                        Gửi lại OTP
                    </button>
                </form>
                )}

                <p className="text-center mt-4 mb-0 text-muted small">
                    Đã nhớ mật khẩu? <Link to="/login" className="fw-bold text-decoration-none text-purple ms-1">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;