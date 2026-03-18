package com.example.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SetPinRequest {

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^\\d{4,6}$", message = "Mã PIN phải là số và có độ dài từ 4 đến 6 ký tự")
    private String pin;
}