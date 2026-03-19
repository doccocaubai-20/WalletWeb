package com.example.wallet.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class MonthlyTransactionSummaryDTO {
    private BigDecimal incoming;
    private BigDecimal outgoing;

    public BigDecimal getNet() {
        BigDecimal in = incoming == null ? BigDecimal.ZERO : incoming;
        BigDecimal out = outgoing == null ? BigDecimal.ZERO : outgoing;
        return in.subtract(out);
    }
}
