package com.example.wallet.security;

import com.example.wallet.entity.UserAccount;
import com.example.wallet.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User không tồn tại!"));

      
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(userAccount.getRole());

        return new User(
                userAccount.getUsername(),
                userAccount.getPassword(),
                Collections.singletonList(authority)
        );
    }
}