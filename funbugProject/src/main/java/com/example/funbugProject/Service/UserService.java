package com.example.funbugProject.Service;

import com.example.funbugProject.DTO.UserDto;
import com.example.funbugProject.Entity.User;

import java.util.List;

public interface UserService {
    UserDto createUser(UserDto userDto);
    UserDto getUserById(int id);
    List<UserDto> getAllUsers();
    UserDto updateUser(int userId, UserDto updatedUser);
    void deleteUser(int userId);
}
