package com.example.wallet.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wallet.dto.AccountInfoDTO;
import com.example.wallet.dto.DepositSavingsRequest;
import com.example.wallet.dto.SavingsAccountDTO;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.TransactionType;
import com.example.wallet.entity.Transactions;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.TransactionTypeRepository;
import com.example.wallet.repository.TransactionsRepository;
import com.example.wallet.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final String ACCOUNT_TYPE_PAYMENT = "PAYMENT";
    private static final String ACCOUNT_TYPE_SAVINGS = "SAVINGS";

    private final AccountRepository accountRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionsRepository transactionsRepository;
    private final TransactionTypeRepository transactionTypeRepository;

    public List<AccountInfoDTO> getMyAccounts(String username){
        List<Account> accounts =  accountRepository.findAllByUserAccount_Username(username);

        return accounts.stream().map( acc -> {
            AccountInfoDTO dto = new AccountInfoDTO();
            dto.setAccountNumber(acc.getAccountNumber());
            dto.setBalance(acc.getBalance());
            return dto;
        }).collect(Collectors.toList());
    }

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
    @Transactional
    public String depositSavings(String username, DepositSavingsRequest request){
        Account paymentAccount = accountRepository.findByAccountNumberAndUserAccount_Username(request.getPaymentAccount(),username)
                        .orElseThrow(() -> new RuntimeException("Tài khoản nguồn không tồn tại hoặc không thuộc quyền sở hữu của bạn."));

        if (!ACCOUNT_TYPE_PAYMENT.equals(paymentAccount.getAccountType())){
            throw new RuntimeException("Tài khoản nguồn phải là ví thanh toán!");
        }

        if (paymentAccount.getPin() == null || !passwordEncoder.matches(request.getPaymentPin(), paymentAccount.getPin())){
            throw new RuntimeException("INVALID_PIN");
        }

        Account savingsAccount = accountRepository.findByAccountNumberAndUserAccount_Username(request.getSavingsAccount(),username)
                        .orElseThrow(() -> new RuntimeException("Tài khoản tiết kiệm không tồn tại hoặc không thuộc quyền sở hữu của bạn."));

        if (!ACCOUNT_TYPE_SAVINGS.equals(savingsAccount.getAccountType())){
            throw new RuntimeException("Tài khoản tiết kiệm không hợp lệ!");
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền không hợp lệ");
        }

        if (paymentAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("INSUFFICIENT_BALANCE");
        }
        
        paymentAccount.setBalance(paymentAccount.getBalance().subtract(request.getAmount()));
        savingsAccount.setBalance(savingsAccount.getBalance().add(request.getAmount()));
        accountRepository.save(paymentAccount);
        accountRepository.save(savingsAccount);

        String code = TransactionService.generateTransactionCode();

        saveTransactionRecord(paymentAccount, request.getAmount().negate(),savingsAccount.getAccountNumber(), "Nạp tiền vào tài khoản tiết kiệm", code, "SAVINGS_DEPOSIT");
        saveTransactionRecord(savingsAccount, request.getAmount(),paymentAccount.getAccountNumber(), "Nhận tiền từ ví thanh toán", code, "SAVINGS_WITHDRAW");
        return "SUCCESS";
    }

    @Transactional
    public String withdrawSavings(String username, DepositSavingsRequest request){
        Account paymentAccount = accountRepository.findByAccountNumberAndUserAccount_Username(request.getPaymentAccount(),username)
                        .orElseThrow(() -> new RuntimeException("Tài khoản nguồn không tồn tại hoặc không thuộc quyền sở hữu của bạn."));

        if (!ACCOUNT_TYPE_PAYMENT.equals(paymentAccount.getAccountType())){
            throw new RuntimeException("Tài khoản nguồn phải là ví thanh toán!");
        }

        if (paymentAccount.getPin() == null || !passwordEncoder.matches(request.getPaymentPin(), paymentAccount.getPin())){
            throw new RuntimeException("INVALID_PIN");
        }

        Account savingsAccount = accountRepository.findByAccountNumberAndUserAccount_Username(request.getSavingsAccount(),username)
                        .orElseThrow(() -> new RuntimeException("Tài khoản tiết kiệm không tồn tại hoặc không thuộc quyền sở hữu của bạn."));

        if (!ACCOUNT_TYPE_SAVINGS.equals(savingsAccount.getAccountType())){
            throw new RuntimeException("Tài khoản tiết kiệm không hợp lệ!");
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền không hợp lệ");
        }

        if (savingsAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("INSUFFICIENT_BALANCE");
        }
        
        savingsAccount.setBalance(savingsAccount.getBalance().subtract(request.getAmount()));
        paymentAccount.setBalance(paymentAccount.getBalance().add(request.getAmount()));
        accountRepository.save(paymentAccount);
        accountRepository.save(savingsAccount);

        String code = TransactionService.generateTransactionCode();

        saveTransactionRecord(savingsAccount, request.getAmount().negate(),paymentAccount.getAccountNumber(), "Rút tiền từ tài khoản tiết kiệm", code, "SAVINGS_WITHDRAW");
        saveTransactionRecord(paymentAccount, request.getAmount(),savingsAccount.getAccountNumber(), "Nhận tiền từ tài khoản tiết kiệm", code, "SAVINGS_WITHDRAW");
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

                                       String related, String desc, String code, String typeName) {
        Transactions trans = new Transactions();
        
        trans.setAccount(acc);
        trans.setAmount(amount);
        trans.setBalanceAfter(acc.getBalance()); 
        trans.setTransactionCode(code); 
        trans.setRelatedParty(related);
        trans.setDescription(desc);
        trans.setStatus("SUCCESS");
        
        TransactionType type = transactionTypeRepository.findByTypeName(typeName)
            .or(() -> transactionTypeRepository.findByTypeName("TRANSFER"))
            .orElse(null);
        trans.setTransactionType(type);

        transactionsRepository.save(trans);
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
