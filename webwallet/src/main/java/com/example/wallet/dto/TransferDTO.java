// TransferDTO.java
package com.example.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class TransferDTO {
    
    @NotBlank(message = "Số tài khoản gửi không được để trống")
    private String senderAccountNumber;

    @NotBlank(message = "Số tài khoản nhận không được để trống")
    private String receiverAccountNumber; 

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1.0", message = "Số tiền chuyển tối thiểu là 1")
    private BigDecimal amount;     
    
    @Size(max = 255, message = "Nội dung chuyển tiền quá dài")
    private String description;

    @NotBlank(message = "Mã PIN không được để trống")
    @Size(min = 6, max = 6, message = "Mã PIN phải đúng 6 ký tự")
    private String pin;

    @NotNull(message = "Mã loại giao dịch không được để trống")
    private Integer transactionTypeId;
}