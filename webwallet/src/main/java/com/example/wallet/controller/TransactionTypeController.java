package com.example.wallet.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.entity.TransactionType;
import com.example.wallet.repository.TransactionTypeRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/transaction-types")
@RequiredArgsConstructor
public class TransactionTypeController {

    private final TransactionTypeRepository repository;

    @GetMapping
    public ResponseEntity<List<TransactionType>> getAllTypes() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<TransactionType> createType(@RequestBody TransactionType transactionType) {
        return ResponseEntity.ok(repository.save(transactionType));
    }
}
