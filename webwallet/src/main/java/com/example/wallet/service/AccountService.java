package com.example.wallet.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.wallet.dto.AccountInfoDTO;
import com.example.wallet.entity.Account;
import com.example.wallet.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

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
}
