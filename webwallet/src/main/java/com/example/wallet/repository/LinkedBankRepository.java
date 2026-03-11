package com.example.wallet.repository;

import com.example.wallet.entity.LinkedBank;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LinkedBankRepository extends JpaRepository<LinkedBank, Integer> {
    List<LinkedBank> findAllByUserAccount_Username(String username);
    Optional<LinkedBank> findByIdAndUserAccount_Username(Integer id, String username);
}
