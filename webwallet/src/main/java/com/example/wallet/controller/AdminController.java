package com.example.wallet.controller;

import com.example.wallet.entity.Bank;
import com.example.wallet.service.LinkedBankService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final LinkedBankService linkedBankService;

    @PostMapping("/banks")
    public ResponseEntity<Bank> addSupportedBank(@RequestBody Bank bank) {
        return ResponseEntity.ok(linkedBankService.addSupportedBank(bank));
    }
}