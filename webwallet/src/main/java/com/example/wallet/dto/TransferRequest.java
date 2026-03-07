package com.example.wallet.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferRequest {
    private Integer senderId;
    private String receiverPhone;
    private BigDecimal amount;
    private String description;
    private String pin;
}