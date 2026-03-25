package com.example.wallet.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DepositSavingsRequest {
    @NotBlank(message = "Không được để trống")
    private String paymentAccount;
    @NotBlank(message = "Không được để trống")
    private String savingsAccount;
    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amount;

    @NotBlank(message = "Mã PIN không được để trống")
    private String paymentPin;
}
