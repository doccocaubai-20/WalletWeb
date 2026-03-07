package com.example.wallet.repository;

import com.example.wallet.entity.People;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PeopleRepository extends JpaRepository<People, Integer> {
    Optional<People> findByIdCard(String idCard);
    Optional<People> findByPhoneNumber(String phoneNumber);
    boolean existsByIdCard(String idCard);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
}