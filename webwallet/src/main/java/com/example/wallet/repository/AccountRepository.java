package com.example.wallet.repository;

import com.example.wallet.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByAccountNumber(String accountNumber);
    Optional<Account> findByUserAccount_UserID(Integer userID);

    boolean existsByAccountNumber(String accountNumber);

    /**
     * Tìm tài khoản kèm theo thông tin cá nhân (FullName) 
     * Dùng để "Xác nhận tên người nhận" ngay khi nhập xong STK trên giao diện.
     */
    @Query("SELECT a FROM Account a " +
           "JOIN FETCH a.userAccount u " +
           "JOIN FETCH u.people p " +
           "WHERE a.accountNumber = :accountNumber")
    Optional<Account> findByAccountNumberWithProfile(@Param("accountNumber") String accountNumber);

    /**
     * Kiểm tra số dư của một tài khoản cụ thể.
     * Dùng để check nhanh xem có đủ tiền chuyển không trước khi thực hiện giao dịch.
     */
    @Query("SELECT a.balance FROM Account a WHERE a.accountNumber = :accountNumber")
    BigDecimal getBalanceByAccountNumber(@Param("accountNumber") String accountNumber);
}