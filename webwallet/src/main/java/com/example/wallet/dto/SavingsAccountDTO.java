package com.example.wallet.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class SavingsAccountDTO {
    private String accountNumber;
    private BigDecimal balance;
    private BigDecimal targetAmount;
}
