package com.example.wallet.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServicePurchaseRequest {
    @NotNull(message = "serviceId là bắt buộc")
    private Integer serviceId;

    @NotBlank(message = "accountNumber là bắt buộc")
    private String accountNumber;

    @NotNull(message = "quantity là bắt buộc")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotBlank(message = "PIN là bắt buộc")
    private String pin;
}
