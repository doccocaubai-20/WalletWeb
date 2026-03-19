package com.example.wallet.repository;

import com.example.wallet.entity.Transactions;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionsRepository extends JpaRepository<Transactions, Integer> {
    
    // Đổi từ findByCreatedBy thành findByAccount_AccID (Tìm theo ID của Account liên kết)
    List<Transactions> findByAccount_AccIDOrderByCreatedDateDesc(Integer accID);

    // Giữ lại hàm tìm kiếm người nhận gần đây nếu bạn đã viết trước đó
    @Query("SELECT DISTINCT t.relatedParty FROM Transactions t " +
           "WHERE t.account.accountNumber = :accountNumber " +
           "AND t.amount < 0 " +
           "ORDER BY t.createdDate DESC")
    List<String> findRecentRecipients(@Param("accountNumber") String accountNumber);

    Page<Transactions> findByAccount_AccountNumberOrderByTransIDDesc(String accountNumber,Pageable pageable);

        @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transactions t " +
            "WHERE t.account.accountNumber = :accountNumber " +
            "AND t.createdDate >= :startDate " +
            "AND t.createdDate < :endDate " +
            "AND t.amount > 0")
        BigDecimal sumIncomingByAccountAndDateRange(@Param("accountNumber") String accountNumber,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate);

        @Query("SELECT COALESCE(SUM(-t.amount), 0) FROM Transactions t " +
            "WHERE t.account.accountNumber = :accountNumber " +
            "AND t.createdDate >= :startDate " +
            "AND t.createdDate < :endDate " +
            "AND t.amount < 0")
        BigDecimal sumOutgoingByAccountAndDateRange(@Param("accountNumber") String accountNumber,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate);
}