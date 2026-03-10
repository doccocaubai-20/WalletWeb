package com.example.wallet.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống!")
    private String fullName;

    @NotNull(message = "Ngày sinh không được để trống!")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Email không được để trống!")
    @Email(message = "Định dạng email không hợp lệ!")
    private String email;

    @NotBlank(message = "Địa chỉ không được để trống!")
    private String address;
    
    @NotBlank(message = "Giới tính không được để trống!")
    private String gender;
}