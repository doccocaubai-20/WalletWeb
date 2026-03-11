package com.example.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LinkedBankRequest {

    @NotBlank(message = "Tên ngân hàng không được để trống")
    private String bankName;

    @NotBlank(message = "Mã ngân hàng không được để trống")
    @Size(max = 10, message = "Mã ngân hàng không được quá 10 ký tự")
    private String bankCode;

    @NotBlank(message = "Số tài khoản ngân hàng không được để trống")
    @Size(max = 30, message = "Số tài khoản ngân hàng quá dài")
    private String accountNumber;
}
