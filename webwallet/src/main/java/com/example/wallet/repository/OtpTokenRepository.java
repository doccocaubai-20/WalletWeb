package com.example.wallet.repository;

import com.example.wallet.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Integer> {
    Optional<OtpToken> findTopByEmailAndIsUsedFalseOrderByExpiryTimeDesc(String email);
    Optional<OtpToken> findTopByEmailOrderByExpiryTimeDesc(String email);
}