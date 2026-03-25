package com.example.wallet.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import com.example.wallet.dto.RegisterRequest;
import com.example.wallet.dto.ResetPasswordRequest;
import com.example.wallet.dto.UpdateProfileRequest;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.OtpToken;
import com.example.wallet.entity.People;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.OtpTokenRepository;
import com.example.wallet.repository.PeopleRepository;
import com.example.wallet.repository.UserAccountRepository;
import com.example.wallet.security.JwtUtils;

import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    
    private final UserAccountRepository userAccountRepository;
    private final PeopleRepository peopleRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpTokenRepository otpTokenRepository;
    private final JwtUtils jwtUtils;

        @Value("${app.avatar.upload-dir:uploads/avatars}")
        private String avatarUploadDir;

        private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif"
        );

    @Transactional
    public String register(RegisterRequest dto){

        if (userAccountRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }
        if (peopleRepository.existsByIdCard(dto.getIdCard())) {
            throw new RuntimeException("Số CCCD này đã được đăng ký!");
        }
        if (peopleRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email này đã được đăng ký!");
        }
        if (peopleRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại này đã được đăng ký!");
        }

        People people = new People();
        people.setFullName(dto.getFullName());
        people.setIdCard(dto.getIdCard());
        people.setDateOfBirth(dto.getDateOfBirth());
        people.setEmail(dto.getEmail());
        people.setPhoneNumber(dto.getPhoneNumber());
        people.setAddress(dto.getAddress());
        people.setGender(dto.getGender());

        People savedPeople = peopleRepository.save(people);

        UserAccount userAccount = new UserAccount();
        userAccount.setPeople(savedPeople);
        userAccount.setUsername(dto.getUsername());

        userAccount.setPassword(passwordEncoder.encode(dto.getPassword())); 

        userAccount.setRole("CUSTOMER");
        userAccount.setStatus("ACTIVE");
    
        UserAccount savedAccount = userAccountRepository.save(userAccount);

        Account account = new Account();
        String newAccountNumber = System.currentTimeMillis() + String.format("%03d", (int)(Math.random() * 1000));
        account.setAccountNumber(newAccountNumber);
        account.setAccountType("PAYMENT");
        account.setStatus("ACTIVE");
        account.setUserAccount(savedAccount);

        accountRepository.save(account);

        return "Đăng ký thành công!";
    }

    public UserAccount login(String username, String password) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Tên đăng nhập không tồn tại!"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Mật khẩu sai!");
        }

        return user;
    }

    public UserAccount getMyProfile(String username) {
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));
    }


    @Transactional
    public String updateProfile(Integer userID,UpdateProfileRequest dto){
        UserAccount user = userAccountRepository.findById(userID).
        orElseThrow(() ->  new RuntimeException("Không tìm thấy ID"));
        
        People people = user.getPeople();
        if (dto.getEmail() != null && !dto.getEmail().equals(people.getEmail())){
            if (peopleRepository.existsByEmail(dto.getEmail())){
                throw new RuntimeException("Email này đã được sử dụng");
            }
            people.setEmail(dto.getEmail());
        }
        people.setFullName(dto.getFullName());
        people.setAddress(dto.getAddress());
        people.setDateOfBirth(dto.getDateOfBirth());
        people.setGender(dto.getGender());
        peopleRepository.save(people);
        return "Cập nhập thông tin cá nhân thành công!";
    }

    @Transactional
    public String changePassword(String username,String oldPassword,String newPassword){
        UserAccount user = userAccountRepository.findByUsername(username).
        orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        // Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userAccountRepository.save(user);

        return "Đổi mật khẩu thành công!";
    }

    @Transactional
    public String updateProfileAvatar(String username, MultipartFile avatarFile) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new RuntimeException("Ảnh đại diện không hợp lệ!");
        }

        if (avatarFile.getSize() > 2 * 1024 * 1024) {
            throw new RuntimeException("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB!");
        }

        String contentType = avatarFile.getContentType() == null ? "" : avatarFile.getContentType().toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new RuntimeException("Định dạng ảnh không hợp lệ!");
        }

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> "";
        };

        if (extension.isEmpty()) {
            throw new RuntimeException("Định dạng ảnh không hợp lệ!");
        }

        Path uploadDirPath = Paths.get(avatarUploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(uploadDirPath);

            String fileName = "avatar-" + user.getUserID() + "-" + UUID.randomUUID() + extension;
            Path targetPath = uploadDirPath.resolve(fileName);

            Files.copy(avatarFile.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            People people = user.getPeople();
            String currentAvatarUrl = people.getAvatarUrl();

            if (currentAvatarUrl != null && currentAvatarUrl.startsWith("/uploads/avatars/")) {
                Path oldFilePath = uploadDirPath.resolve(currentAvatarUrl.replace("/uploads/avatars/", "")).normalize();
                if (oldFilePath.startsWith(uploadDirPath)) {
                    Files.deleteIfExists(oldFilePath);
                }
            }

            people.setAvatarUrl("/uploads/avatars/" + fileName);
            peopleRepository.save(people);
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu ảnh đại diện. Vui lòng thử lại.");
        }

        return "Cập nhật ảnh đại diện thành công!";
    }

    @Transactional
    public void setAccountPin(String username,String accountNumber, String pin) {
        Account account = accountRepository.findByAccountNumberAndUserAccount_Username(accountNumber,username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản ngân hàng!"));

        String encryptedPin = passwordEncoder.encode(pin);
        account.setPin(encryptedPin);
        accountRepository.save(account);
    }

    public boolean validatePassword(String username, String password) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        return passwordEncoder.matches(password, user.getPassword());
    }

    public boolean validateAccountPin(String accountNumber, String pin) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản ngân hàng!"));

        return passwordEncoder.matches(pin, account.getPin());
    }

    public void validateBalance(String accountNumber, BigDecimal amount) {
        Account sender = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Tài khoản gửi không tồn tại!"));

        if (sender.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Không đủ tiền"); 
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền phải lớn hơn 0!");
        }
    }


    @Transactional
    public String forgotPassword(String email) {

        userAccountRepository.findByPeople_Email(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        Optional<OtpToken> lastTokenOpt = otpTokenRepository.findTopByEmailOrderByExpiryTimeDesc(email);
        if (lastTokenOpt.isPresent()) {
            OtpToken lastToken = lastTokenOpt.get();
            if (lastToken.getExpiryTime().isAfter(LocalDateTime.now().plusMinutes(4))) {
                throw new RuntimeException("Bạn thao tác quá nhanh. Vui lòng đợi 60 giây trước khi yêu cầu mã mới!");
            }
        }

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        
        OtpToken otpToken = new OtpToken();
        otpToken.setEmail(email);
        otpToken.setOtpCode(otpCode);
        otpToken.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        otpToken.setUsed(false);
        otpToken.setFailedAttempts(0);  
        otpTokenRepository.save(otpToken);

        emailService.sendOtpEmail(email, otpCode);

        return "Mã xác nhận đã được gửi đến email của bạn. Mã có hiệu lực trong 5 phút.";
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    public String verifyOtp(String email, String otp) {
        userAccountRepository.findByPeople_Email(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        OtpToken otpToken = otpTokenRepository.findTopByEmailAndIsUsedFalseOrderByExpiryTimeDesc(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã OTP hợp lệ cho email này!"));

        if (otpToken.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpToken.setUsed(true);
            otpTokenRepository.save(otpToken);
            throw new RuntimeException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới!");
        }

        if (!otpToken.getOtpCode().equals(otp)) {
            otpToken.setFailedAttempts(otpToken.getFailedAttempts() + 1);
            int remaining = 5 - otpToken.getFailedAttempts();

            if (remaining <= 0) {
                otpToken.setUsed(true);
                otpTokenRepository.save(otpToken);
                throw new RuntimeException("Bạn đã nhập sai 5 lần. Mã OTP đã bị hủy!");
            }

            otpTokenRepository.save(otpToken);
            throw new RuntimeException("Mã OTP không chính xác! Bạn còn " + remaining + " lần nhập.");
        }

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        return jwtUtils.generatePasswordResetToken(email);
    }

    @Transactional
    public String resetPassword(ResetPasswordRequest dto) {
        if (!jwtUtils.validatePasswordResetToken(dto.getResetToken())) {
            throw new RuntimeException("Reset token không hợp lệ hoặc đã hết hạn!");
        }
        

        String email = jwtUtils.extractUsername(dto.getResetToken());

        UserAccount user = userAccountRepository.findByPeople_Email(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userAccountRepository.save(user);

        return "Đặt lại mật khẩu thành công!";
    }
}
