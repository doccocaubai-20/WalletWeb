package com.example.wallet.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class AccountInfoDTO {
    private String accountNumber;
    private BigDecimal balance;
}