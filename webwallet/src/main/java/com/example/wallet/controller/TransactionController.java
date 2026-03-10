package com.example.wallet.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.dto.TransactionHistoryDTO;
import com.example.wallet.dto.TransferDTO;
import com.example.wallet.service.TransactionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/transfer")
    public ResponseEntity<?> transferMoney(Principal principal,@Valid @RequestBody TransferDTO dto) {
        String result = transactionService.transferMoney(principal.getName(), dto);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history/{accountNumber}")
    public ResponseEntity<?> getTransactionHistory(
                            Principal principal,
                            @PathVariable String accountNumber,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "10") int size) {

        return  ResponseEntity.ok( transactionService.getHistory(principal.getName(), accountNumber, page, size));
    }

}