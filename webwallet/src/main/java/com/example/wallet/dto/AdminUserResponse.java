package com.example.wallet.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class AdminUserResponse {
    private Integer userID;
    private String username;
    private String role;
    private String status;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String gender;
    private LocalDate dateOfBirth;
}