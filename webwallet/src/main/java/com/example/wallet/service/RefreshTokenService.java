package com.example.wallet.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wallet.entity.RefreshToken;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.RefreshTokenRepository;
import com.example.wallet.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserAccountRepository userAccountRepository;

    private final Long refreshTokenDurationMs = 604800000L;

    @Transactional
    public RefreshToken createRefreshToken(String username) {
        UserAccount user = userAccountRepository.findByUsername(username)
                            .orElseThrow( () -> new RuntimeException("Không tìm thấy user!"));
        
        RefreshToken refreshToken = refreshTokenRepository.findByUserAccount(user)
                                        .orElse(new RefreshToken());

        refreshToken.setUserAccount(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());
        
        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token đã hết hạn. Vui lòng đăng nhập lại!");
        }
        return token;
    }

    @Transactional
    public void deleteByUsername(String username) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        refreshTokenRepository.deleteByUserAccount(user);
    }

    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token không tồn tại!"));
    }   

}
