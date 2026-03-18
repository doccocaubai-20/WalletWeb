package com.example.wallet.controller;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.dto.AccountInfoDTO;
import com.example.wallet.dto.SetPinRequest;
import com.example.wallet.entity.Account;
import com.example.wallet.service.AccountService;
import com.example.wallet.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final UserService userService;
    @GetMapping("/my-accounts")
    public ResponseEntity<List<AccountInfoDTO>> getMyAccounts(Principal principal){
        return ResponseEntity.ok(accountService.getMyAccounts(principal.getName()));
    }

    @GetMapping("/my-account")
    public ResponseEntity<?> getMyPrimaryAccount(Principal principal) {
        Account primaryAccount = accountService.getPrimaryAccount(principal.getName());
            
        return ResponseEntity.ok(primaryAccount);
    }
    @PutMapping("/set-pin")
    public ResponseEntity<?> setPin(Principal principal, @Valid @RequestBody SetPinRequest request) {
        boolean isPasswordValid = userService.validatePassword(principal.getName(), request.getPassword());
        if (!isPasswordValid) {
            return ResponseEntity.badRequest().body("Mật khẩu không chính xác");
        }

        userService.setAccountPin(principal.getName(), request.getPin());
        return ResponseEntity.ok("Mã PIN đã được đặt thành công");
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
