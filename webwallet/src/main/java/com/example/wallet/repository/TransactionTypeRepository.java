package com.example.wallet.repository;

import com.example.wallet.entity.TransactionType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionTypeRepository extends JpaRepository<TransactionType, Integer> {
	Optional<TransactionType> findByTypeName(String typeName);
}