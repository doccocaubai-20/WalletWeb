package com.example.wallet.repository;

import com.example.wallet.entity.UserAccount;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {
    Optional<UserAccount> findByUsername(String username);
    boolean existsByUsername(String username);

    Optional<UserAccount> findByPeople_Email(String email);

    Page<UserAccount> findByRoleOrderByUserIDAsc(String role,Pageable pageable);

        @Query("""
                SELECT u
                FROM UserAccount u
                LEFT JOIN u.people p
                WHERE u.role = :role
                    AND (
                                LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                         OR LOWER(COALESCE(p.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                         OR LOWER(COALESCE(p.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                         OR LOWER(COALESCE(p.phoneNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                         OR STR(u.userID) LIKE CONCAT('%', :keyword, '%')
                    )
                ORDER BY u.userID ASC
                """)
        Page<UserAccount> searchByRoleAndKeyword(@Param("role") String role, @Param("keyword") String keyword, Pageable pageable);
}