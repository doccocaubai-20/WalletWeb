const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const validateProfileForm = (formProfile) => {
  if (!formProfile?.fullName?.trim()) return 'Họ và tên không được để trống.';
  if (!formProfile?.dateOfBirth) return 'Vui lòng chọn ngày sinh.';
  if (!formProfile?.email?.trim()) return 'Email không được để trống.';
  if (!formProfile?.address?.trim()) return 'Địa chỉ không được để trống.';
  if (!formProfile?.gender?.trim()) return 'Vui lòng chọn giới tính.';
  return '';
};

export const validatePasswordForm = (passwordForm) => {
  if (!passwordForm?.oldPassword) return 'Vui lòng nhập mật khẩu hiện tại.';
  if (!passwordForm?.newPassword) return 'Vui lòng nhập mật khẩu mới.';
  if (String(passwordForm.newPassword).length < 6) return 'Mật khẩu mới cần tối thiểu 6 ký tự.';
  if (passwordForm.newPassword !== passwordForm.confirmPassword) return 'Xác nhận mật khẩu mới chưa khớp.';
  return '';
};

export const validateTopupRequest = ({ selectedBankId, accountNumber, amount, requireLinkedBank = true }) => {
  if (requireLinkedBank && !selectedBankId) return 'Vui lòng chọn ngân hàng liên kết.';
  if (!accountNumber) return 'Không tìm thấy tài khoản ví để nạp tiền.';
  if (toNumber(amount) <= 0) return 'Số tiền nạp phải lớn hơn 0.';
  return '';
};

export const validateWithdrawRequest = ({ selectedBankId, accountNumber, amount, pin }) => {
  if (!selectedBankId) return 'Vui lòng chọn ngân hàng nhận tiền.';
  if (!accountNumber) return 'Không tìm thấy tài khoản ví để rút tiền.';
  if (toNumber(amount) <= 0) return 'Số tiền rút phải lớn hơn 0.';
  if (!pin || String(pin).length !== 6) return 'Mã PIN phải đúng 6 ký tự.';
  return '';
};

export const validateLinkedBankRequest = ({ bankId, bankAccountNumber }) => {
  if (!bankId) return 'Vui lòng chọn ngân hàng cần liên kết.';
  if (!String(bankAccountNumber || '').trim()) return 'Vui lòng nhập số tài khoản ngân hàng.';
  if (String(bankAccountNumber || '').trim().length < 6) return 'Số tài khoản ngân hàng không hợp lệ.';
  return '';
};

export const validateTransferRequest = ({
  senderAccountNumber,
  receiverAccountNumber,
  amount,
  senderBalance,
  transferTypeId,
  receiverLookupState,
}) => {
  if (!senderAccountNumber) return 'Không tìm thấy tài khoản gửi.';
  if (!String(receiverAccountNumber || '').trim()) return 'Vui lòng nhập số tài khoản nhận.';
  if (toNumber(amount) <= 0) return 'Số tiền chuyển phải lớn hơn 0.';
  if (toNumber(amount) > toNumber(senderBalance)) return 'Số dư không đủ để thực hiện giao dịch này.';
  if (String(receiverAccountNumber || '').trim() === String(senderAccountNumber || '')) {
    return 'Không thể chuyển tiền cho chính tài khoản của bạn.';
  }
  if (!transferTypeId) return 'Chưa xác định được loại giao dịch chuyển tiền.';
  if (receiverLookupState === 'loading') return 'Đang xác minh tài khoản nhận. Vui lòng chờ...';
  return '';
};

export const validateTransferPin = (pin) => {
  if (!pin || String(pin).length !== 6) return 'Mã PIN phải đúng 6 ký tự.';
  return '';
};
