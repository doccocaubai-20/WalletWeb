package com.example.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class WithdrawRequest {

    @NotBlank(message = "Số tài khoản không được để trống")
    private String accountNumber;

    @NotNull(message = "Ngân hàng liên kết không được để trống")
    private Integer linkedBankId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1.0", message = "Số tiền rút tối thiểu là 1")
    private BigDecimal amount;

    @NotBlank(message = "Mã PIN không được để trống")
    @Size(min = 6, max = 6, message = "Mã PIN phải đúng 6 ký tự")
    private String pin;

    @Size(max = 255, message = "Nội dung rút tiền quá dài")
    private String description;
}
