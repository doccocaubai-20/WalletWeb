package com.example.wallet.repository;

import com.example.wallet.entity.UserAccount;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Integer> {
    Optional<UserAccount> findByUsername(String username);
    boolean existsByUsername(String username);

    Optional<UserAccount> findByPeople_Email(String email);

    Page<UserAccount> findByRoleOrderByUserIDAsc(String role,Pageable pageable);
}