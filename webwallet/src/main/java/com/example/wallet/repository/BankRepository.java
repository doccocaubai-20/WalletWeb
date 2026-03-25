package com.example.wallet.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.wallet.entity.Bank;

public interface BankRepository extends JpaRepository<Bank,Integer>{
	boolean existsByBankCodeIgnoreCase(String bankCode);
	boolean existsByBankNameIgnoreCase(String bankName);

}
