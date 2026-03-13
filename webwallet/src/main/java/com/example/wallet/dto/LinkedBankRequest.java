package com.example.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LinkedBankRequest {

    @NotNull(message = "Vui lòng chọn ngân hàng")
    private Integer bankId;

    @NotBlank(message = "Số tài khoản ngân hàng không được để trống")
    @Size(max = 30, message = "Số tài khoản ngân hàng quá dài")
    private String accountNumber;
}