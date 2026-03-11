package com.example.wallet.service;

import com.example.wallet.dto.LinkedBankRequest;
import com.example.wallet.dto.LinkedBankResponse;
import com.example.wallet.entity.LinkedBank;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.LinkedBankRepository;
import com.example.wallet.repository.UserAccountRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LinkedBankService {

    private final LinkedBankRepository linkedBankRepository;
    private final UserAccountRepository userAccountRepository;

    public List<LinkedBankResponse> getLinkedBanks(String username) {
        return linkedBankRepository.findAllByUserAccount_Username(username)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LinkedBankResponse linkBank(String username, LinkedBankRequest request) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        LinkedBank bank = new LinkedBank();
        bank.setUserAccount(user);
        bank.setBankName(request.getBankName());
        bank.setBankCode(request.getBankCode());
        bank.setAccountNumber(request.getAccountNumber());
        bank.setStatus("ACTIVE");

        LinkedBank saved = linkedBankRepository.save(bank);
        return toResponse(saved);
    }

    private LinkedBankResponse toResponse(LinkedBank bank) {
        LinkedBankResponse response = new LinkedBankResponse();
        response.setId(bank.getId());
        response.setBankName(bank.getBankName());
        response.setBankCode(bank.getBankCode());
        response.setMaskedAccountNumber(maskAccountNumber(bank.getAccountNumber()));
        response.setStatus(bank.getStatus());
        return response;
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        String last4 = accountNumber.substring(accountNumber.length() - 4);
        return "****" + last4;
    }
}
