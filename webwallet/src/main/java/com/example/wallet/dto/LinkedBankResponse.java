package com.example.wallet.dto;

import lombok.Data;

@Data
public class LinkedBankResponse {
    private Integer id;
    private String bankName;
    private String bankCode;
    private String maskedAccountNumber;
    private String status;
}
