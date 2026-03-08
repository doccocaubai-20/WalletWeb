package com.example.wallet.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wallet.dto.RegisterRequest;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.People;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.PeopleRepository;
import com.example.wallet.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    
    private final UserAccountRepository userAccountRepository;
    private final PeopleRepository peopleRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;



    @Transactional
    public String register(RegisterRequest dto){

        if (userAccountRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }
        if (peopleRepository.existsByIdCard(dto.getIdCard())) {
            throw new RuntimeException("Số CCCD này đã được đăng ký!");
        }
        if (peopleRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email này đã được đăng ký!");
        }
        if (peopleRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại này đã được đăng ký!");
        }

        People people = new People();
        people.setFullName(dto.getFullName());
        people.setIdCard(dto.getIdCard());
        people.setDateOfBirth(dto.getDateOfBirth());
        people.setEmail(dto.getEmail());
        people.setPhoneNumber(dto.getPhoneNumber());
        people.setAddress(dto.getAddress());

        People savedPeople = peopleRepository.save(people);

        UserAccount userAccount = new UserAccount();
        userAccount.setPeople(savedPeople);
        userAccount.setUsername(dto.getUsername());

        userAccount.setPassword(passwordEncoder.encode(dto.getPassword())); 

        userAccount.setRole("CUSTOMER");
        userAccount.setStatus("ACTIVE");
    
        UserAccount savedAccount = userAccountRepository.save(userAccount);

        Account account = new Account();
        String newAccountNumber;
        do {
            long randomNum = (long) (Math.random()* 9_000_000_000L) + 1_000_000_000L;
            newAccountNumber = String.valueOf(randomNum);
        }while (accountRepository.existsByAccountNumber(newAccountNumber));

        account.setAccountNumber(newAccountNumber);
        account.setUserAccount(savedAccount);

        accountRepository.save(account);

        return "Đăng ký thành công!";
    }

    public UserAccount login(String username,String password){
        UserAccount user = userAccountRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("Tên đăng nhập không tồn tại!"));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Mật khẩu sai!");
        }

        return user;
    }

    public UserAccount getMyProfile(String username) {
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));
    }


    @Transactional
    public String updateProfile(Integer userID,RegisterRequest dto){
        UserAccount user = userAccountRepository.findById(userID).
        orElseThrow(() ->  new RuntimeException("Không tìm thấy ID"));
        
        People people = user.getPeople();
        if (dto.getEmail() != null && !dto.getEmail().equals(people.getEmail())){
            if (peopleRepository.existsByEmail(dto.getEmail())){
                throw new RuntimeException("Email này đã được sử dụng");
            }
            people.setEmail(dto.getEmail());
        }
        people.setFullName(dto.getFullName());
        people.setAddress(dto.getAddress());
        people.setDateOfBirth(dto.getDateOfBirth());

        peopleRepository.save(people);
        return "Cập nhập thông tin cá nhân thành công!";
    }

    @Transactional
    public String changePassword(Integer userID,String oldPassword,String newPassword){
        UserAccount user = userAccountRepository.findById(userID).
        orElseThrow(() -> new RuntimeException("Không tìm thấy ID"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        // Mã hóa và lưu mật khẩu mới
        user.setPassword(passwordEncoder.encode(newPassword));
        userAccountRepository.save(user);

        return "Đổi mật khẩu thành công!";
    }

    public String getReceiverName(String accountNumber) {
        return accountRepository.findByAccountNumberWithProfile(accountNumber)
                .map(acc -> acc.getUserAccount().getPeople().getFullName())
                .orElseThrow(() -> new RuntimeException("Số tài khoản không tồn tại!"));
    }

    public void validateBalance(String accountNumber, BigDecimal amount) {
        Account sender = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Tài khoản gửi không tồn tại!"));

        if (sender.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Không đủ tiền"); 
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Số tiền phải lớn hơn 0!");
        }
    }

}
