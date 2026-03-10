package com.example.wallet.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("novapayewallet@gmail.com"); 
        message.setTo(toEmail);
        message.setSubject("Mã xác nhận đặt lại mật khẩu - Ví điện tử");
        message.setText("Xin chào,\n\n"
                + "Mã OTP để đặt lại mật khẩu của bạn là: " + otpCode + "\n"
                + "Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                + "Trân trọng,\nĐội ngũ hỗ trợ.");

        mailSender.send(message);
    }
}