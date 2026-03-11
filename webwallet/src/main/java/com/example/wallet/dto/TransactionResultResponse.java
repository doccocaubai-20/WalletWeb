package com.example.wallet.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class TransactionResultResponse {
    private String message;
    private String transactionCode;
    private BigDecimal balanceAfter;

    public TransactionResultResponse(String message, String transactionCode, BigDecimal balanceAfter) {
        this.message = message;
        this.transactionCode = transactionCode;
        this.balanceAfter = balanceAfter;
    }
}
