package com.example.wallet.dto;

import lombok.Data;

@Data
public class AdminUserResponse {
    private Integer userID;
    private String username;
    private String role;
    private String status;
    private String fullName;
    private String email;
}