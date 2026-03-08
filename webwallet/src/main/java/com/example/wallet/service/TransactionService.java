package com.example.wallet.service;

import com.example.wallet.dto.TransferDTO;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.TransactionType;
import com.example.wallet.entity.Transactions;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.TransactionsRepository;
import com.example.wallet.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final AccountRepository accountRepository;
    private final UserAccountRepository userAccountRepository;
    private final TransactionsRepository transactionsRepository;



    @Transactional
    public String transferMoney(String currentUsername, TransferDTO dto) {
        UserAccount currentUser = userAccountRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Tài khoản hệ thống không tồn tại!"));

        Account sender = accountRepository.findByAccountNumber(dto.getSenderAccountNumber())
                .orElseThrow(() -> new RuntimeException("Ví gửi không tồn tại!"));

        if (!sender.getUserAccount().getUserID().equals(currentUser.getUserID())) {
            throw new RuntimeException("Lỗi bảo mật: Bạn không có quyền thao tác trên ví này!");
        }

        if (sender.getPin() == null || !sender.getPin().equals(dto.getPin())) {
            throw new RuntimeException("INVALID_PIN");
        }
        if (sender.getBalance().compareTo(dto.getAmount()) < 0) {
            throw new RuntimeException("INSUFFICIENT_BALANCE");
        }

        Account receiver = accountRepository.findByAccountNumber(dto.getReceiverAccountNumber())
                .orElseThrow(() -> new RuntimeException("Ví nhận không tồn tại!"));

        sender.setBalance(sender.getBalance().subtract(dto.getAmount()));
        receiver.setBalance(receiver.getBalance().add(dto.getAmount()));
        accountRepository.save(sender);
        accountRepository.save(receiver);
        
        String code = "NP" + System.currentTimeMillis();
        
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
}