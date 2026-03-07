package com.example.wallet.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class TransferDTO {
    private String senderAccountNumber;
    private String receiverAccountNumber; 
    private BigDecimal amount;     
    private String description;
    private String pin;
}
