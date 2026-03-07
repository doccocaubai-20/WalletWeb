package com.example.wallet.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String idCard;
    private LocalDate dateOfBirth;
    private String email;
    private String phoneNumber;
    private String address;
    private String username;
    private String password;
    
}
