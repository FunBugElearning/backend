package com.example.funbugProject.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private String email;
    private int id;

    public AuthResponse(String token, String username, String email, int id) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.id = id;
    }
}
