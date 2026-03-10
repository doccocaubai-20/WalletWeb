package com.example.wallet.repository;

import com.example.wallet.entity.Account;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByAccountNumber(String accountNumber);
    
    /**
     * Tìm tài khoản kèm theo thông tin cá nhân (FullName) 
     * Dùng để "Xác nhận tên người nhận" ngay khi nhập xong STK trên giao diện.
     */
    @Query("SELECT a FROM Account a " +
           "JOIN FETCH a.userAccount u " +
           "JOIN FETCH u.people p " +
           "WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberWithProfile(@Param("accountNumber") String accountNumber);

    List<Account> findAllByUserAccount_Username(String username);
    Optional<Account> findByAccountNumberAndUserAccount_Username(String accountNumber, String username);
}