package com.example.wallet.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.dto.ServiceProductRequest;
import com.example.wallet.service.ServiceProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/service-products")
@RequiredArgsConstructor
public class AdminServiceProductController {

    private final ServiceProductService serviceProductService;

    @GetMapping
    public ResponseEntity<?> getAllServices() {
        return ResponseEntity.ok(serviceProductService.getAllForAdmin());
    }

    @PostMapping
    public ResponseEntity<?> createService(@Valid @RequestBody ServiceProductRequest request) {
        return ResponseEntity.ok(serviceProductService.createService(request));
    }

    @PutMapping("/{serviceId}")
    public ResponseEntity<?> updateService(@PathVariable Integer serviceId, @Valid @RequestBody ServiceProductRequest request) {
        return ResponseEntity.ok(serviceProductService.updateService(serviceId, request));
    }

    @DeleteMapping("/{serviceId}")
    public ResponseEntity<?> deleteService(@PathVariable Integer serviceId){
        serviceProductService.deleteService(serviceId);
        return ResponseEntity.ok("Đã khóa dịch vụ (INACTIVE)");
    }
}
