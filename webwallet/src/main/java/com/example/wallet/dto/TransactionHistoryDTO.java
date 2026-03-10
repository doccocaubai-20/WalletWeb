package com.example.wallet.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class TransactionHistoryDTO {
    private String transactionCode;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String relatedParty;
    private String description;
    private String status;
    private String type;
}
