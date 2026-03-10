package com.example.wallet.controller;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.dto.AccountInfoDTO;
import com.example.wallet.service.AccountService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/my-accounts")
    public ResponseEntity<List<AccountInfoDTO>> getMyAccounts(Principal principal){
        return ResponseEntity.ok(accountService.getMyAccounts(principal.getName()));
    }

    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<BigDecimal> getAccountBalance(Principal principal,@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getBalanceOfAccount(principal.getName(), accountNumber));
    }

    @GetMapping("/{accountNumber}/verify")
    public ResponseEntity<?> verifyAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getReceiverName(accountNumber));
    }

}
