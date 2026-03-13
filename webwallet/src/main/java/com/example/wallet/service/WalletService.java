package com.example.wallet.service;

import com.example.wallet.dto.TopUpRequest;
import com.example.wallet.dto.TransactionResultResponse;
import com.example.wallet.dto.WithdrawRequest;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.LinkedBank;
import com.example.wallet.entity.TransactionType;
import com.example.wallet.entity.Transactions;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.LinkedBankRepository;
import com.example.wallet.repository.TransactionTypeRepository;
import com.example.wallet.repository.TransactionsRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final AccountRepository accountRepository;
    private final LinkedBankRepository linkedBankRepository;
    private final TransactionsRepository transactionsRepository;
    private final TransactionTypeRepository transactionTypeRepository;

    @Transactional
    public TransactionResultResponse topUp(String username, TopUpRequest request) {
        Account account = accountRepository.findByAccountNumberAndUserAccount_Username(
                request.getAccountNumber(), username)
                .orElseThrow(() -> new RuntimeException("Ví không tồn tại hoặc không thuộc quyền sở hữu của bạn!"));

        LinkedBank bank = linkedBankRepository.findByIdAndUserAccount_Username(
                request.getLinkedBankId(), username)
                .orElseThrow(() -> new RuntimeException("Ngân hàng liên kết không tồn tại hoặc không thuộc quyền sở hữu của bạn!"));

        account.setBalance(account.getBalance().add(request.getAmount()));
        accountRepository.save(account);

        String code = generateTransactionCode();
        String description = buildDescription("Nạp tiền từ", bank, request.getDescription());

        saveTransactionRecord(account,
                request.getAmount(),
                bank.getBank().getBankCode(),
                description,
                code,
                "TOPUP");

        return new TransactionResultResponse("TOPUP_SUCCESS", code, account.getBalance());
    }

    @Transactional
    public TransactionResultResponse withdraw(String username, WithdrawRequest request) {
        Account account = accountRepository.findByAccountNumberAndUserAccount_Username(
                request.getAccountNumber(), username)
                .orElseThrow(() -> new RuntimeException("Ví không tồn tại hoặc không thuộc quyền sở hữu của bạn!"));

        LinkedBank bank = linkedBankRepository.findByIdAndUserAccount_Username(
                request.getLinkedBankId(), username)
                .orElseThrow(() -> new RuntimeException("Ngân hàng liên kết không tồn tại hoặc không thuộc quyền sở hữu của bạn!"));

        if (account.getPin() == null || !account.getPin().equals(request.getPin())) {
            throw new RuntimeException("INVALID_PIN");
        }

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("INSUFFICIENT_BALANCE");
        }

        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        String code = generateTransactionCode();
        String description = buildDescription("Rút về", bank, request.getDescription());

        saveTransactionRecord(account,
                request.getAmount().negate(),
                bank.getBank().getBankCode(),
                description,
                code,
                "WITHDRAW");

        return new TransactionResultResponse("WITHDRAW_SUCCESS", code, account.getBalance());
    }

    private String generateTransactionCode() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timeString = now.format(formatter);
        int randomNumber = 1000 + new Random().nextInt(9000);
        return "NP" + timeString + randomNumber;
    }

    private void saveTransactionRecord(Account account, BigDecimal amount, String related,
                                       String description, String code, String typeName) {
        Transactions trans = new Transactions();
        trans.setAccount(account);
        trans.setAmount(amount);
        trans.setBalanceAfter(account.getBalance());
        trans.setTransactionCode(code);
        trans.setRelatedParty(related);
        trans.setDescription(description);
        trans.setStatus("SUCCESS");

        TransactionType type = transactionTypeRepository.findByTypeName(typeName).orElse(null);
        trans.setTransactionType(type);

        transactionsRepository.save(trans);
    }

    private String buildDescription(String prefix, LinkedBank bank, String userDescription) {
        String masked = maskAccountNumber(bank.getAccountNumber());
        String base = prefix + " " + bank.getBank().getBankName() + " (" + masked + ")";
        if (userDescription == null || userDescription.isBlank()) {
            return base;
        }
        return base + " - " + userDescription.trim();
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        String last4 = accountNumber.substring(accountNumber.length() - 4);
        return "****" + last4;
    }
}
