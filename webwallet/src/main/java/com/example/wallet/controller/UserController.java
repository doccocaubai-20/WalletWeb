package com.example.wallet.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.wallet.dto.ChangePasswordDTO;
import com.example.wallet.dto.RegisterRequest;
import com.example.wallet.dto.TransferDTO;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.service.UserService;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;



@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest dto) {
        try{
            String result = userService.register(dto);
            return ResponseEntity.ok(result);
        }catch(RuntimeException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> logEntity(@RequestBody UserAccount loginRequest) {
        try {
            UserAccount user = userService.login(loginRequest.getUsername(), loginRequest.getPassword());
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
       
    }
    
    @PutMapping("/profile/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable Integer userId,@RequestBody RegisterRequest dto) {
        try {
            return ResponseEntity.ok(userService.updateProfile(userId, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PutMapping("/change-password/{userId}")
    public ResponseEntity<?> changePassword(@PathVariable Integer userId,
                                            @RequestBody ChangePasswordDTO dto
                                            ) {
        try {
            return ResponseEntity.ok(userService.changePassword(userId, dto.getOldPassword(), dto.getNewPassword()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/verify-account/{accountNumber}")
    public ResponseEntity<?> verifyAccount(@PathVariable String accountNumber) {
        try {
            String fullName = userService.getReceiverName(accountNumber);
            return ResponseEntity.ok(fullName);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @GetMapping("/check-balance")
    public ResponseEntity<?> checkBalance(@RequestParam String accountNumber,@RequestParam BigDecimal amount) {
        try {
            userService.validateBalance(accountNumber, amount);
            return ResponseEntity.ok("OK");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/transfer")
    public ResponseEntity<?> transferMoney(@RequestBody TransferDTO dto) {
       try {
            // Gọi service để thực hiện trừ/cộng tiền và lưu log
            String result = userService.transferMoney(dto);
            return ResponseEntity.ok(result); // Trả về "SUCCESS"
        } catch (RuntimeException e) {
            // Trả về mã lỗi để Frontend xử lý (VD: INVALID_PIN, INSUFFICIENT_BALANCE)
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    

    @GetMapping
    public ResponseEntity<List<UserAccount>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
}
