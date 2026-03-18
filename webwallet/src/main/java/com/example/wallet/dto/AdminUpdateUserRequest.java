package com.example.wallet.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AdminUpdateUserRequest {
    private String role;
    private String status;
    private String fullName;
    private LocalDate dateOfBirth;
    private String email;
    private String phoneNumber;
    private String address;
    private String gender;
}