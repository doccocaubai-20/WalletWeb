package com.example.wallet.repository;

import com.example.wallet.entity.RefreshToken;
import com.example.wallet.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUserAccount(UserAccount userAccount);
}