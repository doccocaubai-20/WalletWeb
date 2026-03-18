package com.example.wallet.service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wallet.dto.AdminCreateUserRequest;
import com.example.wallet.dto.AdminUpdateUserRequest;
import com.example.wallet.dto.AdminUserResponse;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.People;
import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.PeopleRepository;
import com.example.wallet.repository.UserAccountRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserAccountRepository userAccountRepository;
    private final PeopleRepository peopleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountRepository accountRepository;


    public Page<AdminUserResponse> getUsersByRole(String role,int page,int size){
        Pageable pageable = PageRequest.of(page , size );

        Page<UserAccount> listUsers = userAccountRepository.findByRoleOrderByUserIDAsc(role,pageable);

        return listUsers.map(t -> {
           AdminUserResponse dto = new AdminUserResponse();
           if (t.getPeople() != null) {
                dto.setEmail(t.getPeople().getEmail());
                dto.setFullName(t.getPeople().getFullName());
            }
           dto.setRole(t.getRole());
           dto.setStatus(t.getStatus());
           dto.setUserID(t.getUserID());
           dto.setUsername(t.getUsername());
           return dto; 
        });
    }



    @Transactional
    public String adminCreateUser(AdminCreateUserRequest request){
        if (userAccountRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }
        if (peopleRepository.existsByIdCard(request.getIdCard())) {
            throw new RuntimeException("Số CCCD này đã được đăng ký!");
        }
        if (peopleRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được đăng ký!");
        }
        if (peopleRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Số điện thoại này đã được đăng ký!");
        }

        People people = new People();
        people.setAddress(request.getAddress());
        people.setDateOfBirth(request.getDateOfBirth());
        people.setEmail(request.getEmail());
        people.setFullName(request.getFullName());
        people.setGender(request.getGender());
        people.setIdCard(request.getIdCard());
        people.setPhoneNumber(request.getPhoneNumber());

        People savedPeople = peopleRepository.save(people);

        UserAccount userAccount = new UserAccount();
        userAccount.setPeople(savedPeople);
        userAccount.setUsername(request.getUsername());
        userAccount.setPassword(passwordEncoder.encode(request.getPassword())); 
        userAccount.setRole(request.getRole() != null ? request.getRole() : "CUSTOMER");
        userAccount.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        UserAccount savedAccount = userAccountRepository.save(userAccount);

        Account account = new Account();
        String newAccountNumber = System.currentTimeMillis() + String.format("%03d", (int)(Math.random() * 1000));
        account.setAccountNumber(newAccountNumber);
        account.setUserAccount(savedAccount);
        accountRepository.save(account);

        return "Thêm người dùng thành công!";
    }

    @Transactional
    public String updateUserByAdmin(Integer userId ,AdminUpdateUserRequest request){
        UserAccount user = userAccountRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        
        People people = user.getPeople();
        if (request.getEmail() != null && !request.getEmail().equals(people.getEmail())) {
            if (peopleRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email này đã được sử dụng!");
            }
            people.setEmail(request.getEmail());
        }
        
        if (request.getFullName() != null) people.setFullName(request.getFullName());
        if (request.getAddress() != null) people.setAddress(request.getAddress());
        if (request.getDateOfBirth() != null) people.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) people.setGender(request.getGender());
        if (request.getPhoneNumber() != null) people.setPhoneNumber(request.getPhoneNumber());
        
        peopleRepository.save(people);
        userAccountRepository.save(user);
        
        return "Cập nhật thông tin người dùng thành công!";
    }

    @Transactional
    public String disableUser(Integer userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));
        
        user.setStatus("INACTIVE");
        userAccountRepository.save(user);
        
        return "Tài khoản đã được vô hiệu hóa thành công!";
    }
}
