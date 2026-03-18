package com.example.wallet.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.wallet.entity.TransactionType;
import com.example.wallet.repository.TransactionTypeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TransactionTypeService {

    private final TransactionTypeRepository transactionTypeRepository;

    public List<TransactionType> getALlTypes(){
        return transactionTypeRepository.findAll();
    }

    public TransactionType addService(TransactionType service){
        return transactionTypeRepository.save(service);
    }
}
