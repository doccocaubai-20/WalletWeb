package com.example.wallet.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "service_products")
@Data
public class ServiceProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer serviceId;

    private String serviceName;
    private String category;
    private String description;
    private BigDecimal price;
    private String status = "ACTIVE";
    private LocalDateTime createdDate = LocalDateTime.now();
}
