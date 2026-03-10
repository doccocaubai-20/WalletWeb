package com.example.wallet.controller;

import com.example.wallet.dto.TransferDTO;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.Transactions;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.TransactionsRepository;
import com.example.wallet.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final AccountRepository accountRepository;
    private final TransactionService transactionService;
    private final TransactionsRepository transactionsRepository;


    @PostMapping("/spam-transactions")
    public ResponseEntity<?> spamTransactions(@RequestParam(defaultValue = "100") int count) {
        List<Account> accounts = accountRepository.findAll();
        
        if (accounts.size() < 2) {
            return ResponseEntity.badRequest().body("Cần ít nhất 2 tài khoản trong DB để chuyển tiền chéo!");
        }

        Random random = new Random();
        int successCount = 0;

        for (int i = 0; i < count; i++) {
            // 1. Chọn ngẫu nhiên người gửi và người nhận
            Account sender = accounts.get(random.nextInt(accounts.size()));
            Account receiver = accounts.get(random.nextInt(accounts.size()));

            // Bỏ qua nếu tự chuyển cho chính mình
            if (sender.getAccID().equals(receiver.getAccID())) {
                continue;
            }

            // 2. Tạo dữ liệu chuyển tiền giả
            TransferDTO dto = new TransferDTO();
            dto.setSenderAccountNumber(sender.getAccountNumber());
            dto.setReceiverAccountNumber(receiver.getAccountNumber());
            
            // Random số tiền từ 10.000 đến 500.000
            int randomAmount = 10000 + random.nextInt(490000);
            dto.setAmount(new BigDecimal(randomAmount));
            
            dto.setDescription("Spam giao dịch số " + i);
            dto.setPin("123456"); // Đảm bảo PIN này đúng với PIN bạn lưu trong DB
            dto.setTransactionTypeId(1); // Mặc định 1 là chuyển tiền

            // 3. Gọi trực tiếp Service
            try {
                // Truyền username của người gửi vào để giả lập việc đang đăng nhập
                transactionService.transferMoney(sender.getUserAccount().getUsername(), dto);
                successCount++;
            } catch (Exception e) {
                // Bỏ qua các lỗi như: không đủ số dư, sai mã PIN... để vòng lặp tiếp tục chạy
                System.out.println("Lỗi ở giao dịch " + i + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Đã spam thành công " + successCount + " / " + count + " giao dịch.");
    }

    @PostMapping("/randomize-dates")
    public ResponseEntity<?> randomizeDates() {
        List<Transactions> list = transactionsRepository.findAll();
        Random random = new Random();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss"); // Format bạn đang dùng

        for (Transactions t : list) {
            // Lùi ngẫu nhiên từ 0 đến 90 ngày (3 tháng), cùng với giờ/phút/giây ngẫu nhiên
            LocalDateTime fakeDate = now.minusDays(random.nextInt(90))
                                        .minusHours(random.nextInt(24))
                                        .minusMinutes(random.nextInt(60))
                                        .minusSeconds(random.nextInt(60));
            
            // 1. Cập nhật trường thời gian (Bạn sửa lại tên hàm setTransactionDate cho đúng với Entity của bạn)
            t.setCreatedDate(fakeDate); 

            // 2. Sinh lại mã giao dịch cho khớp với ngày fake
            String timeString = fakeDate.format(formatter);
            int randomNumber = 1000 + random.nextInt(9000);
            t.setTransactionCode("NP" + timeString + randomNumber);
        }

        // Lưu toàn bộ cục dữ liệu đã sửa xuống Database
        transactionsRepository.saveAll(list);
        
        return ResponseEntity.ok("Đã xào nấu thành công thời gian của " + list.size() + " giao dịch rải rác trong 3 tháng qua!");
    }

}