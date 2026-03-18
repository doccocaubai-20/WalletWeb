package com.example.wallet.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminCreateUserRequest {
    @NotBlank(message = "Username không được để trống")
    private String username;
    @NotBlank(message = "Password không được để trống")
    private String password;
    private String role; 
    private String status; 
    
    private String fullName;
    private String idCard;
    private LocalDate dateOfBirth;
    private String email;
    private String phoneNumber;
    private String address;
    private String gender;
}
