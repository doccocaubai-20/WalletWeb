package com.example.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "people")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class People {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer peopleID;

    @Column(nullable = false, length = 100)
    private String fullName;
    
    private String gender;

    @Column(name = "IDCard", nullable = false, unique = true, length = 20)
    private String idCard;

    private LocalDate dateOfBirth;

    @Column(name = "Email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "PhoneNumber", nullable = false, unique = true, length = 15)
    private String phoneNumber;

    @Column(length = 255)
    private String address;

}