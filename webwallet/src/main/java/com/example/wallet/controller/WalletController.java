package com.example.wallet.controller;

import com.example.wallet.dto.TopUpRequest;
import com.example.wallet.dto.TransactionResultResponse;
import com.example.wallet.dto.WithdrawRequest;
import com.example.wallet.service.WalletService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @PostMapping("/topup")
    public ResponseEntity<TransactionResultResponse> topUp(Principal principal,
                                                           @Valid @RequestBody TopUpRequest request) {
        return ResponseEntity.ok(walletService.topUp(principal.getName(), request));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<TransactionResultResponse> withdraw(Principal principal,
                                                              @Valid @RequestBody WithdrawRequest request) {
        return ResponseEntity.ok(walletService.withdraw(principal.getName(), request));
    }
}
