package com.example.wallet.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "banks")
@Data
public class Bank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String bankName;

    @Column(nullable = false, unique = true, length = 10)
    private String bankCode;
    
    private String logoUrl; 
}