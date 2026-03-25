package com.example.wallet.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.wallet.dto.*;
import com.example.wallet.entity.RefreshToken;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.security.JwtUtils;
import com.example.wallet.service.RefreshTokenService;
import com.example.wallet.service.UserService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest dto) {
        return ResponseEntity.ok(userService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        UserAccount user = userService.login(loginRequest.getUsername(), loginRequest.getPassword());

        String accessToken = jwtUtils.generateToken(user.getUsername());
      
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());
        
        return ResponseEntity.ok(new JwtResponse(accessToken, refreshToken.getToken()));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request){
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken);

        refreshTokenService.verifyExpiration(refreshToken);

        UserAccount user = refreshToken.getUserAccount();

        String newAccessToken = jwtUtils.generateToken(user.getUsername());
        
        return ResponseEntity.ok(new JwtResponse(newAccessToken, requestRefreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Principal principal){
        String username = principal.getName();

        refreshTokenService.deleteByUsername(username);
        return ResponseEntity.ok("Đăng xuất thành công!");
    }

    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile(Principal principal) {
        return ResponseEntity.ok(userService.getMyProfile(principal.getName()));
    }

    @PutMapping("/my-profile")
    public ResponseEntity<?> updateMyProfile(Principal principal, @Valid @RequestBody UpdateProfileRequest dto) {
        UserAccount user = userService.getMyProfile(principal.getName());
        return ResponseEntity.ok(userService.updateProfile(user.getUserID(), dto));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Principal principal, @Valid @RequestBody ChangePasswordDTO dto) {
        return ResponseEntity.ok(userService.changePassword(principal.getName(), dto.getOldPassword(), dto.getNewPassword()));
    }

    @PutMapping("/my-profile/avatar")
    public ResponseEntity<?> updateMyAvatar(Principal principal, @RequestParam("avatar") MultipartFile avatarFile) {
        return ResponseEntity.ok(userService.updateProfileAvatar(principal.getName(), avatarFile));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(userService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(userService.resetPassword(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String resetToken = userService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of(
                "message", "Xác thực OTP thành công.",
                "resetToken", resetToken
        ));
    }

}