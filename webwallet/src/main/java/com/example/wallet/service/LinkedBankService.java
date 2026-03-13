package com.example.wallet.service;

import com.example.wallet.dto.LinkedBankRequest;
import com.example.wallet.dto.LinkedBankResponse;
import com.example.wallet.entity.Bank;
import com.example.wallet.entity.LinkedBank;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.BankRepository;
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

    private final BankRepository bankRepository;
    
    public Bank addSupportedBank(Bank bank) {
        return bankRepository.save(bank);
    }

    public List<Bank> getAllSupportedBanks() {
        return bankRepository.findAll();
    }

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

        Bank bank = bankRepository.findById(request.getBankId())
                .orElseThrow(() -> new RuntimeException("Ngân hàng không hỗ trợ hoặc không tồn tại!"));

        LinkedBank linkedBank = new LinkedBank();
        linkedBank.setUserAccount(user);
        linkedBank.setBank(bank);
        linkedBank.setAccountNumber(request.getAccountNumber());
        linkedBank.setStatus("ACTIVE");

        LinkedBank saved = linkedBankRepository.save(linkedBank);
        return toResponse(saved);
    }

    private LinkedBankResponse toResponse(LinkedBank linkedBank) {
        LinkedBankResponse response = new LinkedBankResponse();
        response.setId(linkedBank.getId());
        response.setBankName(linkedBank.getBank().getBankName());
        response.setBankCode(linkedBank.getBank().getBankCode());
        response.setMaskedAccountNumber(maskAccountNumber(linkedBank.getAccountNumber()));
        response.setStatus(linkedBank.getStatus());
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
