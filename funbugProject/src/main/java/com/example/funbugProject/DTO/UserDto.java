package com.example.funbugProject.DTO;

import com.example.funbugProject.Entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor


public class UserDto {
    private int id;
    private String name;
    private String email;
    private String password;
    private Role role;

}
