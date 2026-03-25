package com.example.wallet.exception;

import java.time.Instant;
import java.util.Map;

import lombok.Data;

@Data
public class ApiErrorResponse {
    private final String code;
    private final String message;
    private final String error;
    private final Map<String, String> details;
    private final String timestamp;

    public ApiErrorResponse(String code, String message) {
        this(code, message, null);
    }

    public ApiErrorResponse(String code, String message, Map<String, String> details) {
        this.code = code;
        this.message = message;
        this.error = message;
        this.details = details;
        this.timestamp = Instant.now().toString();
    }

}