package com.example.wallet.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Họ và tên không được để trống!")
    private String fullName;

    @NotBlank(message = "Số CCCD không được để trống!")
    @Pattern(regexp = "^[0-9]{12}$", message = "Số CCCD phải gồm 12 chữ số!")
    private String idCard;

    @NotNull(message = "Ngày sinh không được để trống!")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Email không được để trống!")
    @Email(message = "Định dạng email không hợp lệ!")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống!")
    @Pattern(regexp = "^(0[3|5|7|8|9])+([0-9]{8})$", message = "Số điện thoại không hợp lệ!")
    private String phoneNumber;

    @NotBlank(message = "Địa chỉ không được để trống!")
    private String address;

    @NotBlank(message = "Tên đăng nhập không được để trống!")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống!")
    private String password;
}