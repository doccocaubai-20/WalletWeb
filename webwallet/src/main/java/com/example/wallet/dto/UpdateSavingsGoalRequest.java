package com.example.wallet.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateSavingsGoalRequest {
    @NotNull(message = "Mục tiêu tiết kiệm không được để trống")
    @DecimalMin(value = "1.0", message = "Mục tiêu tiết kiệm phải lớn hơn 0")
    private BigDecimal targetAmount;
}
