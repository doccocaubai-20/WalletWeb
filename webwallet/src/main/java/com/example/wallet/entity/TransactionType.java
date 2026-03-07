package com.example.wallet.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "transaction_types")
@Data
public class TransactionType {
    @Id
    private Integer typeID;
    private String typeName;
    private String description;
}