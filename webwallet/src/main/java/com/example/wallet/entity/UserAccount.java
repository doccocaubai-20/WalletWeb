package com.example.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "useraccount")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userID;
    
    @Column(name = "Username", nullable = false, unique = true, length = 50)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(length = 20)
    private String status = "ACTIVE";

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne
    @JoinColumn(name = "PeopleID", referencedColumnName = "peopleID", nullable = false, unique = true)
    private People people;
}