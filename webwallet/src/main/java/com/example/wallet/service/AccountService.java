package com.example.wallet.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.wallet.dto.AccountInfoDTO;
import com.example.wallet.dto.SavingsAccountDTO;
import com.example.wallet.entity.Account;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final String ACCOUNT_TYPE_PAYMENT = "PAYMENT";
    private static final String ACCOUNT_TYPE_SAVINGS = "SAVINGS";

    private final AccountRepository accountRepository;
    private final UserAccountRepository userAccountRepository;

    public List<AccountInfoDTO> getMyAccounts(String username){
        List<Account> accounts =  accountRepository.findAllByUserAccount_Username(username);

        return accounts.stream().map( acc -> {
            AccountInfoDTO dto = new AccountInfoDTO();
            dto.setAccountNumber(acc.getAccountNumber());
            dto.setBalance(acc.getBalance());
            return dto;
        }).collect(Collectors.toList());
    }

    // Lấy số dư của 1 ví cụ thể
    public BigDecimal getBalanceOfAccount(String username, String accountNumber) {
        return accountRepository.findByAccountNumberAndUserAccount_Username(accountNumber, username)
                .map(Account::getBalance)
                .orElseThrow(() -> new RuntimeException("Ví không tồn tại hoặc không thuộc quyền sở hữu của bạn!"));
    }

    public String getReceiverName(String accountNumber) {
        return accountRepository.findByAccountNumberWithProfile(accountNumber)
                .map(acc -> acc.getUserAccount().getPeople().getFullName())
                .orElseThrow(() -> new RuntimeException("Số tài khoản không tồn tại!"));
    }

    public Account getPrimaryAccount(String username) {
        return accountRepository
                .findFirstByUserAccount_UsernameAndAccountTypeAndStatusOrderByAccIDAsc(
                        username,
                        ACCOUNT_TYPE_PAYMENT,
                        "ACTIVE"
                )
                .or(() -> accountRepository.findFirstByUserAccount_UsernameAndAccountTypeOrderByAccIDAsc(
                        username,
                        ACCOUNT_TYPE_PAYMENT
                ))
                .orElseThrow(() -> new RuntimeException("Tài khoản này chưa có ví thanh toán!"));
    }

    public Optional<Account> getSavingsAccount(String username) {
        return accountRepository.findFirstByUserAccount_UsernameAndAccountTypeOrderByAccIDAsc(
                username,
                ACCOUNT_TYPE_SAVINGS
        );
    }

    public Optional<SavingsAccountDTO> getSavingsAccountDto(String username) {
        return getSavingsAccount(username).map(this::toSavingsAccountDto);
    }

    public SavingsAccountDTO openSavingsAccount(String username, BigDecimal targetAmount) {
        if (accountRepository.existsByUserAccount_UsernameAndAccountType(username, ACCOUNT_TYPE_SAVINGS)) {
            throw new RuntimeException("Bạn đã có tài khoản tiết kiệm.");
        }

        var user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản người dùng!"));

        Account savingsAccount = new Account();
        savingsAccount.setAccountNumber(generateUniqueAccountNumber());
        savingsAccount.setUserAccount(user);
        savingsAccount.setStatus("ACTIVE");
        savingsAccount.setCurrency("VND");
        savingsAccount.setAccountType(ACCOUNT_TYPE_SAVINGS);
        savingsAccount.setBalance(BigDecimal.ZERO);
        savingsAccount.setTargetAmount(targetAmount);

        return toSavingsAccountDto(accountRepository.save(savingsAccount));
    }

    public SavingsAccountDTO updateSavingsGoal(String username, BigDecimal targetAmount) {
        Account savingsAccount = getSavingsAccount(username)
                .orElseThrow(() -> new RuntimeException("Bạn chưa mở tài khoản tiết kiệm."));

        savingsAccount.setTargetAmount(targetAmount);
        return toSavingsAccountDto(accountRepository.save(savingsAccount));
    }

    private String generateUniqueAccountNumber() {
        for (int i = 0; i < 8; i++) {
            String candidate = System.currentTimeMillis() + String.format("%03d", (int) (Math.random() * 1000));
            if (accountRepository.findByAccountNumber(candidate).isEmpty()) {
                return candidate;
            }
        }

        throw new RuntimeException("Không thể tạo số tài khoản mới. Vui lòng thử lại.");
    }

    private SavingsAccountDTO toSavingsAccountDto(Account account) {
        SavingsAccountDTO dto = new SavingsAccountDTO();
        dto.setAccountNumber(account.getAccountNumber());
        dto.setBalance(account.getBalance());
        dto.setTargetAmount(account.getTargetAmount());
        return dto;
    }
}
