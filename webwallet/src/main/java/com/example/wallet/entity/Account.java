package com.example.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "account")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer accID;

    @Column(nullable = false, unique = true, length = 20)
    private String accountNumber;

    private BigDecimal balance = BigDecimal.ZERO;

    @Column(length = 5)
    private String currency = "VND";

    @Column(length = 20)
    private String status = "OPEN";

    @Column(nullable = false, length = 20)
    private String accountType = "PAYMENT";

    private LocalDateTime openDate = LocalDateTime.now();

    @Column(precision = 19, scale = 2)
    private BigDecimal targetAmount;

    @ManyToOne
    @JoinColumn(name = "UserID", referencedColumnName = "userID", nullable = false)
    private UserAccount userAccount;

    @Version
    private Long version;
        
    @Column(length = 255)
    private String pin;
}