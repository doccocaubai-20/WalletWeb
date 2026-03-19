package com.example.wallet.controller;

import com.example.wallet.config.VNPayConfig;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.service.WalletService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/vnpay")
public class VNPayController {

    private static class PendingTopUp {
        private final String username;
        private final String accountNumber;
        private final long amount;

        private PendingTopUp(String username, String accountNumber, long amount) {
            this.username = username;
            this.accountNumber = accountNumber;
            this.amount = amount;
        }
    }

    private final Map<String, PendingTopUp> pendingTopUps = new ConcurrentHashMap<>();
    private final WalletService walletService;
    private final AccountRepository accountRepository;

    public VNPayController(WalletService walletService, AccountRepository accountRepository) {
        this.walletService = walletService;
        this.accountRepository = accountRepository;
    }

    @Value("${vnp.tmnCode}")
    private String vnp_TmnCode;

    @Value("${vnp.hashSecret}")
    private String secretKey;

    @Value("${vnp.payUrl}")
    private String vnp_PayUrl;

    @Value("${vnp.returnUrl:http://localhost:8080/api/vnpay/payment-return}")
    private String vnp_ReturnUrl;

    @Value("${vnp.defaultIpAddr:127.0.0.1}")
    private String vnp_DefaultIpAddr;

    @Value("${app.frontendTopupUrl:http://localhost:5173/topup}")
    private String frontendTopupUrl;

    @GetMapping("/create-payment")
    public ResponseEntity<?> createPayment(Principal principal,
                                           @RequestParam long amount,
                                           @RequestParam String accountNumber,
                                           HttpServletRequest request) throws Exception {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Bạn cần đăng nhập để nạp tiền qua VNPAY");
        }

        if (amount <= 0) {
            return ResponseEntity.badRequest().body("Số tiền không hợp lệ");
        }

        if (accountNumber == null || accountNumber.isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu số tài khoản ví để nạp tiền");
        }

        boolean isOwnedAccount = accountRepository
            .findByAccountNumberAndUserAccount_Username(accountNumber, principal.getName())
            .isPresent();
        if (!isOwnedAccount) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Số tài khoản ví không thuộc quyền sở hữu của bạn");
        }

        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = VNPayConfig.getRandomNumber(8);
        String vnp_IpAddr = resolveClientIp(request);
        String vnp_OrderInfo = "Nap tien vao vi " + accountNumber;

        pendingTopUps.put(vnp_TxnRef, new PendingTopUp(principal.getName(), accountNumber, amount));
        
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // VNPAY yêu cầu nhân 100
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        // Định dạng thời gian tạo giao dịch
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        // Thời gian hết hạn giao dịch (15 phút)
        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        // Build dữ liệu để tạo chữ ký bảo mật
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        
        // Tạo URL cuối cùng có kèm chữ ký
        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(secretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnp_PayUrl + "?" + queryUrl;

        return ResponseEntity.ok(paymentUrl);
    }

    @GetMapping("/payment-return")
    public ResponseEntity<Void> paymentReturn(HttpServletRequest request) {
        String responseCode = request.getParameter("vnp_ResponseCode");
        String amountStr = request.getParameter("vnp_Amount");
        String txnRef = request.getParameter("vnp_TxnRef");

        String status = "failed";
        String message = "Giao dịch thất bại hoặc đã bị hủy.";
        long realAmount = 0;

        if (amountStr != null && !amountStr.isBlank()) {
            try {
                realAmount = Long.parseLong(amountStr) / 100;
            } catch (NumberFormatException ignored) {
                realAmount = 0;
            }
        }

        PendingTopUp pending = null;
        if (txnRef != null) {
            pending = pendingTopUps.remove(txnRef);
        }

        if ("00".equals(responseCode) && pending != null && pending.amount == realAmount) {
            try {
                walletService.topUpByVNPay(
                        pending.username,
                        pending.accountNumber,
                        BigDecimal.valueOf(realAmount),
                        txnRef
                );
                status = "success";
                message = "Nạp tiền thành công qua VNPAY.";
            } catch (Exception ex) {
                status = "failed";
                message = "Thanh toán thành công nhưng ghi nhận ví thất bại. Vui lòng liên hệ hỗ trợ.";
            }
        } else if ("00".equals(responseCode) && pending == null) {
            status = "failed";
            message = "Giao dịch đã xử lý trước đó hoặc không hợp lệ.";
        }

        String redirectUrl = frontendTopupUrl
                + "?vnpayStatus=" + URLEncoder.encode(status, StandardCharsets.UTF_8)
                + "&amount=" + realAmount
                + "&message=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return vnp_DefaultIpAddr;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String first = xForwardedFor.split(",")[0].trim();
            if (!first.isBlank()) {
                return first;
            }
        }

        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && !remoteAddr.isBlank()) {
            return remoteAddr;
        }

        return vnp_DefaultIpAddr;
    }
}