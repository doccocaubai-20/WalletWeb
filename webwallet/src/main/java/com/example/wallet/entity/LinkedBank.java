package com.example.wallet.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "linked_bank")
@Data
public class LinkedBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "bank_id", nullable = false)
    private Bank bank;
    
    @Column(nullable = false, length = 30)
    private String accountNumber;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount userAccount;
}
