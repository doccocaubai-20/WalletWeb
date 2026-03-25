package com.example.wallet.controller;

import com.example.wallet.dto.AdminCreateUserRequest;
import com.example.wallet.dto.AdminUpdateUserRequest;
import com.example.wallet.entity.Bank;
import com.example.wallet.entity.TransactionType;
import com.example.wallet.service.AdminService;
import com.example.wallet.service.LinkedBankService;
import com.example.wallet.service.TransactionTypeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final LinkedBankService linkedBankService;
    private final AdminService adminService;
    private final TransactionTypeService transactionTypeService;
    @PostMapping("/banks")
    public ResponseEntity<Bank> addSupportedBank(@RequestBody Bank bank) {
        return ResponseEntity.ok(linkedBankService.addSupportedBank(bank));
    }

    @GetMapping("/banks")
    public ResponseEntity<?> getListBank(){
        return ResponseEntity.ok(linkedBankService.getAllSupportedBanks());
    }
    @GetMapping("/users")
    public ResponseEntity<?> getUsersByRole(@RequestParam(defaultValue = "CUSTOMER") String role,@RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "10") int size,
                            @RequestParam(required = false, defaultValue = "") String keyword){
        return ResponseEntity.ok(adminService.getUsersByRole(role,page,size,keyword));
    }
        
    @PostMapping("/user")
    public ResponseEntity<?> createUser(@Valid @RequestBody AdminCreateUserRequest request){
        return ResponseEntity.ok(adminService.adminCreateUser(request));
    }
    
    @PutMapping("/user/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id,@Valid @RequestBody AdminUpdateUserRequest request){
        return ResponseEntity.ok(adminService.updateUserByAdmin(id, request));
    }
    @DeleteMapping("/user/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.disableUser(id));
    }

    @GetMapping("/services")
    public ResponseEntity<?> getServices(){
        return ResponseEntity.ok(transactionTypeService.getALlTypes());
    }

    @PostMapping("/services")
    public ResponseEntity<?> addService(@Valid @RequestBody TransactionType service){
        return ResponseEntity.ok(transactionTypeService.addService(service));
    }
}