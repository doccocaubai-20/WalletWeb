package com.example.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
public class Transactions {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer transID;

    @ManyToOne
    @JoinColumn(name = "AccountID")
    private Account account;

    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String transactionCode;
    private String relatedParty;

    @ManyToOne
    @JoinColumn(name = "ServiceID")
    private ServiceProduct serviceProduct;

    @ManyToOne
    @JoinColumn(name = "TransTypeID")
    private TransactionType transactionType; 

    private String description;
    private String status;
    private LocalDateTime createdDate = LocalDateTime.now();
}