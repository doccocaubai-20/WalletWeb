package com.example.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Reset token không được để trống")
    private String resetToken;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    private String newPassword;
}