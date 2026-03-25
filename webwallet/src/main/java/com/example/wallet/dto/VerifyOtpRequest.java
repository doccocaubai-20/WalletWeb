package com.example.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Mã OTP không được để trống")
    private String otp;
}
