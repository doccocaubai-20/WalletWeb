package com.example.wallet.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.wallet.dto.TransactionHistoryDTO;
import com.example.wallet.dto.MonthlyTransactionSummaryDTO;
import com.example.wallet.dto.TransferDTO;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.TransactionType;
import com.example.wallet.entity.Transactions;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.TransactionsRepository;
import com.example.wallet.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final AccountRepository accountRepository;
    private final UserAccountRepository userAccountRepository;
    private final TransactionsRepository transactionsRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public String transferMoney(String currentUsername, TransferDTO dto) {
        UserAccount currentUser = userAccountRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Tài khoản hệ thống không tồn tại!"));

        Account sender = accountRepository.findByAccountNumber(dto.getSenderAccountNumber())
                .orElseThrow(() -> new RuntimeException("Ví gửi không tồn tại!"));

        if (!sender.getUserAccount().getUserID().equals(currentUser.getUserID())) {
            throw new RuntimeException("Lỗi bảo mật: Bạn không có quyền thao tác trên ví này!");
        }

        if (sender.getPin() == null || !passwordEncoder.matches(dto.getPin(), sender.getPin())) {
            throw new RuntimeException("INVALID_PIN");
        }
        if (sender.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new RuntimeException("INSUFFICIENT_BALANCE");
        }

        if (dto.getAmount().compareTo(BigDecimal.ZERO) <= 0) 
            throw new RuntimeException("Số tiền không hợp lệ");

        Account receiver = accountRepository.findByAccountNumber(dto.getReceiverAccountNumber())
                .orElseThrow(() -> new RuntimeException("Ví nhận không tồn tại!"));

        sender.setBalance(sender.getBalance().subtract(dto.getAmount()));
        receiver.setBalance(receiver.getBalance().add(dto.getAmount()));
        accountRepository.save(sender);
        accountRepository.save(receiver);
        
        String code = generateTransactionCode();
        
        saveTransactionRecord(sender, 
                              dto.getAmount().negate(), 
                              receiver.getAccountNumber(), 
                              "Chuyển tiền: " + dto.getDescription(), 
                              code, 
                              dto.getTransactionTypeId());

        saveTransactionRecord(receiver, 
                              dto.getAmount(), 
                              sender.getAccountNumber(), 
                              "Nhận tiền từ: " + sender.getAccountNumber(), 
                              code, 
                              dto.getTransactionTypeId());

        return "SUCCESS";
    }

    private String generateTransactionCode() {
        LocalDateTime now = LocalDateTime.now();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timeString = now.format(formatter);
        
        int randomNumber = 1000 + new Random().nextInt(9000);
        
        return "NP" + timeString + randomNumber;
    }
    /**
     * Hàm hỗ trợ lưu bản ghi giao dịch vào Database
     * @param acc: Tài khoản thực hiện giao dịch
     * @param amount: Số tiền (âm nếu là tiền ra, dương nếu là tiền vào)
     * @param related: Số tài khoản đối ứng (người nhận hoặc người gửi)
     * @param desc: Nội dung chi tiết giao dịch
     */
    private void saveTransactionRecord(Account acc, BigDecimal amount, 

                                       String related, String desc, String code, Integer typeId) {
        Transactions trans = new Transactions();
        
        trans.setAccount(acc);
        trans.setAmount(amount);
        trans.setBalanceAfter(acc.getBalance()); 
        trans.setTransactionCode(code); 
        trans.setRelatedParty(related);
        trans.setDescription(desc);
        trans.setStatus("SUCCESS");
        
        TransactionType type = new TransactionType();
        type.setTypeID(typeId);
        trans.setTransactionType(type);

        transactionsRepository.save(trans);
    }

    public Page<TransactionHistoryDTO> getHistory(String username, String accountNumber,int page,int size) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                        .orElseThrow( () -> new RuntimeException("Ví không tồn tại!"));
        if ( !account.getUserAccount().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền xem ví này!");
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<Transactions> transactionPage = transactionsRepository.findByAccount_AccountNumberOrderByTransIDDesc(accountNumber,pageable);

        return transactionPage.map( t -> {
            TransactionHistoryDTO dto = new TransactionHistoryDTO();
            dto.setTransactionCode(t.getTransactionCode());
            dto.setAmount(t.getAmount());
            dto.setBalanceAfter(t.getBalanceAfter());
            dto.setRelatedParty(t.getRelatedParty());
            dto.setDescription(t.getDescription());
            dto.setStatus(t.getStatus());
            dto.setType(t.getAmount().compareTo(BigDecimal.ZERO) > 0 ? "IN" : "OUT");
            return dto;
        });
    }

    public MonthlyTransactionSummaryDTO getCurrentMonthSummary(String username, String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Ví không tồn tại!"));

        if (!account.getUserAccount().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không có quyền xem ví này!");
        }

        LocalDate now = LocalDate.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = now.plusMonths(1).withDayOfMonth(1).atStartOfDay();

        BigDecimal incoming = transactionsRepository.sumIncomingByAccountAndDateRange(
                accountNumber,
                startOfMonth,
                startOfNextMonth
        );
        BigDecimal outgoing = transactionsRepository.sumOutgoingByAccountAndDateRange(
                accountNumber,
                startOfMonth,
                startOfNextMonth
        );

        MonthlyTransactionSummaryDTO dto = new MonthlyTransactionSummaryDTO();
        dto.setIncoming(incoming == null ? BigDecimal.ZERO : incoming);
        dto.setOutgoing(outgoing == null ? BigDecimal.ZERO : outgoing);
        return dto;
    }



}