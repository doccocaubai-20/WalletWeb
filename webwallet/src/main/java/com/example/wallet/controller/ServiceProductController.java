package com.example.wallet.controller;

import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.dto.ServicePurchaseRequest;
import com.example.wallet.service.ServiceProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceProductController {

    private final ServiceProductService serviceProductService;

    @GetMapping
    public ResponseEntity<?> getAvailableServices() {
        return ResponseEntity.ok(serviceProductService.getAllForCustomer());
    }

    @PostMapping("/purchase")
    public ResponseEntity<?> purchaseService(Principal principal, @Valid @RequestBody ServicePurchaseRequest request) {
        return ResponseEntity.ok(serviceProductService.purchaseService(principal.getName(), request));
    }
}
