package com.example.wallet.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.wallet.dto.ServiceProductRequest;
import com.example.wallet.dto.ServicePurchaseRequest;
import com.example.wallet.dto.TransactionResultResponse;
import com.example.wallet.entity.Account;
import com.example.wallet.entity.ServiceProduct;
import com.example.wallet.entity.TransactionType;
import com.example.wallet.entity.Transactions;
import com.example.wallet.repository.AccountRepository;
import com.example.wallet.repository.ServiceProductRepository;
import com.example.wallet.repository.TransactionTypeRepository;
import com.example.wallet.repository.TransactionsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ServiceProductService {

    private final ServiceProductRepository serviceProductRepository;
    private final AccountRepository accountRepository;
    private final TransactionsRepository transactionsRepository;
    private final TransactionTypeRepository transactionTypeRepository;
    private final PasswordEncoder passwordEncoder;

    public List<ServiceProduct> getAllForAdmin() {
        return serviceProductRepository.findAll();
    }

    public List<ServiceProduct> getAllForCustomer() {
        return serviceProductRepository.findByStatusOrderByServiceIdAsc("ACTIVE");
    }

    @Transactional
    public ServiceProduct createService(ServiceProductRequest request) {
        ServiceProduct service = new ServiceProduct();
        service.setServiceName(request.getServiceName().trim());
        service.setCategory(request.getCategory().trim());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setStatus(normalizeStatus(request.getStatus()));
        return serviceProductRepository.save(service);
    }

    @Transactional
    public ServiceProduct updateService(Integer serviceId, ServiceProductRequest request) {
        ServiceProduct service = serviceProductRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ"));

        service.setServiceName(request.getServiceName().trim());
        service.setCategory(request.getCategory().trim());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setStatus(normalizeStatus(request.getStatus()));
        return serviceProductRepository.save(service);
    }

    @Transactional
    public List<ServiceProduct> seedDefaultServices() {
        if (serviceProductRepository.count() > 0) {
            return serviceProductRepository.findAll();
        }

        List<ServiceProduct> defaults = new ArrayList<>();
        defaults.add(build("Gói Data 4G 7 ngày", "Viễn thông", "1GB/ngày trong 7 ngày", new BigDecimal("50000")));
        defaults.add(build("Gói Data 4G 30 ngày", "Viễn thông", "3GB/ngày trong 30 ngày", new BigDecimal("150000")));
        defaults.add(build("Nạp game 100K", "Giải trí", "Thẻ game mệnh giá 100.000 VND", new BigDecimal("100000")));
        defaults.add(build("Nạp game 500K", "Giải trí", "Thẻ game mệnh giá 500.000 VND", new BigDecimal("500000")));
        defaults.add(build("Gói học online tháng", "Giáo dục", "Truy cập kho học liệu premium 30 ngày", new BigDecimal("79000")));
        defaults.add(build("Mua mã quà tặng mua sắm", "Mua sắm", "Mã giảm giá cho đối tác liên kết", new BigDecimal("200000")));

        return serviceProductRepository.saveAll(defaults);
    }

    @Transactional
    public TransactionResultResponse purchaseService(String username, ServicePurchaseRequest request) {
        ServiceProduct service = serviceProductRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Dịch vụ không tồn tại"));

        if (!"ACTIVE".equalsIgnoreCase(service.getStatus())) {
            throw new RuntimeException("Dịch vụ hiện không khả dụng");
        }

        Account account = accountRepository.findByAccountNumberAndUserAccount_Username(
                request.getAccountNumber(),
                username
        ).orElseThrow(() -> new RuntimeException("Ví không tồn tại hoặc không thuộc quyền sở hữu của bạn!"));

        if (account.getPin() == null || !passwordEncoder.matches(request.getPin(), account.getPin())) {
            throw new RuntimeException("INVALID_PIN");
        }

        BigDecimal quantity = BigDecimal.valueOf(request.getQuantity());
        BigDecimal totalAmount = service.getPrice().multiply(quantity);
        if (account.getBalance().compareTo(totalAmount) < 0) {
            throw new RuntimeException("INSUFFICIENT_BALANCE");
        }

        account.setBalance(account.getBalance().subtract(totalAmount));
        accountRepository.save(account);

        Transactions transaction = new Transactions();
        transaction.setAccount(account);
        transaction.setAmount(totalAmount.negate());
        transaction.setBalanceAfter(account.getBalance());
        transaction.setTransactionCode(generateTransactionCode());
        transaction.setRelatedParty("SERVICE:" + service.getServiceName());
        transaction.setServiceProduct(service);
        transaction.setDescription("Mua dịch vụ: " + service.getServiceName() + " x" + request.getQuantity());
        transaction.setStatus("SUCCESS");
        transaction.setCreatedDate(LocalDateTime.now());

        TransactionType type = transactionTypeRepository.findByTypeName("SERVICE_PURCHASE").orElse(null);
        transaction.setTransactionType(type);

        transactionsRepository.save(transaction);

        return new TransactionResultResponse("SERVICE_PURCHASE_SUCCESS", transaction.getTransactionCode(), account.getBalance());
    }

    private ServiceProduct build(String name, String category, String description, BigDecimal price) {
        ServiceProduct service = new ServiceProduct();
        service.setServiceName(name);
        service.setCategory(category);
        service.setDescription(description);
        service.setPrice(price);
        service.setStatus("ACTIVE");
        return service;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return "INACTIVE".equalsIgnoreCase(status) ? "INACTIVE" : "ACTIVE";
    }

    private String generateTransactionCode() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String timeString = now.format(formatter);
        int randomNumber = 1000 + new Random().nextInt(9000);
        return "NP" + timeString + randomNumber;
    }

    @Transactional
    public void deleteService(Integer serviceId) {
        ServiceProduct service = serviceProductRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dịch vụ"));

        if ("INACTIVE".equalsIgnoreCase(service.getStatus())) {
            return;
        }

        service.setStatus("INACTIVE");
        serviceProductRepository.save(service);
    }
}
