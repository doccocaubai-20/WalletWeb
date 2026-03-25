package com.example.wallet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.wallet.entity.ServiceProduct;

@Repository
public interface ServiceProductRepository extends JpaRepository<ServiceProduct, Integer> {
    List<ServiceProduct> findByStatusOrderByServiceIdAsc(String status);
}
