package com.example.wallet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RecentTransactionsDTO {
    private String transactionCode;
    private LocalDateTime createdDate;
    private BigDecimal amount;
    private String status;
    private String description;
    private String accountNumber;
    private String relatedParty;
    private String type;
}
