package com.example.funbugProject.Entity;

import jakarta.persistence.*;
import lombok.*;


@NoArgsConstructor
@Data
@AllArgsConstructor
@Entity
@Table(name = "users")
@Builder
@Setter
@Getter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;

    @Column(name = "email",unique = true, nullable = false)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    public User(String username, String email, String password) {
    }
}
