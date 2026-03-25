package com.example.wallet.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServiceProductRequest {
    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String serviceName;

    @NotBlank(message = "Danh mục không được để trống")
    private String category;

    private String description;

    @NotNull(message = "Giá dịch vụ không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá dịch vụ phải lớn hơn 0")
    private BigDecimal price;

    private String status;
}
