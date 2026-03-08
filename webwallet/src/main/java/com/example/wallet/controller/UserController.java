package com.example.wallet.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.wallet.dto.*;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.security.JwtUtils;
import com.example.wallet.service.UserService;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest dto) {
        return ResponseEntity.ok(userService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> logEntity(@RequestBody UserAccount loginRequest) {
        UserAccount user = userService.login(loginRequest.getUsername(), loginRequest.getPassword());
        
        String token = jwtUtils.generateToken(user.getUsername());
        
        return ResponseEntity.ok(token);
    }

    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile(Principal principal) {
        return ResponseEntity.ok(userService.getMyProfile(principal.getName()));
    }

    @PutMapping("/my-profile")
    public ResponseEntity<?> updateMyProfile(Principal principal, @RequestBody RegisterRequest dto) {
        UserAccount user = userService.getMyProfile(principal.getName());
        return ResponseEntity.ok(userService.updateProfile(user.getUserID(), dto));
    }

    @PutMapping("/change-password/{userId}")
    public ResponseEntity<?> changePassword(@PathVariable Integer userId, @RequestBody ChangePasswordDTO dto) {
        return ResponseEntity.ok(userService.changePassword(userId, dto.getOldPassword(), dto.getNewPassword()));
    }

    @GetMapping("/verify-account/{accountNumber}")
    public ResponseEntity<?> verifyAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(userService.getReceiverName(accountNumber));
    }
    
    @GetMapping("/check-balance")
    public ResponseEntity<?> checkBalance(@RequestParam String accountNumber, @RequestParam BigDecimal amount) {
        userService.validateBalance(accountNumber, amount);
        return ResponseEntity.ok("OK");
    }
    
    @PostMapping("/transfer")
    public ResponseEntity<?> transferMoney(@RequestBody TransferDTO dto) {
        return ResponseEntity.ok(userService.transferMoney(dto));
    }

    @GetMapping
    public ResponseEntity<List<UserAccount>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}