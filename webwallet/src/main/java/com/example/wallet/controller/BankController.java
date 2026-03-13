package com.example.wallet.controller;

import com.example.wallet.dto.LinkedBankRequest;
import com.example.wallet.dto.LinkedBankResponse;
import com.example.wallet.entity.Bank;
import com.example.wallet.service.LinkedBankService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
public class BankController {

    private final LinkedBankService linkedBankService;

    @GetMapping("/supported")
    public ResponseEntity<List<Bank>> getSupportedBanks() {
        return ResponseEntity.ok(linkedBankService.getAllSupportedBanks());
    }

    @GetMapping("/linked")
    public ResponseEntity<List<LinkedBankResponse>> getLinkedBanks(Principal principal) {
        return ResponseEntity.ok(linkedBankService.getLinkedBanks(principal.getName()));
    }

    @PostMapping("/link")
    public ResponseEntity<LinkedBankResponse> linkBank(Principal principal,
                                                       @Valid @RequestBody LinkedBankRequest request) {
        return ResponseEntity.ok(linkedBankService.linkBank(principal.getName(), request));
    }
}
