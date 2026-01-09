package com.example.funbugProject.Service;

import com.example.funbugProject.DTO.UserDto;
import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Exception.ResourceNotFoundException;
import com.example.funbugProject.Mapper.UserMapper;
import com.example.funbugProject.Repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserServiceImpl implements UserService {
    private UserRepository userRepository;

    //POST
    @Override
    public UserDto createUser(UserDto userDto) {
        User user = UserMapper.mapToUser(userDto);
        Optional<User> userOptional = userRepository.findByEmail(user.getEmail());
        if (userOptional.isPresent()) {
            throw new IllegalStateException(" User already exists");
        }
        User savedUser = userRepository.save(user);
        return UserMapper.mapToUserDto(savedUser);
    }
    //GET by ID
    @Override
    public UserDto getUserById(int userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not exists with the given id: " + userId));
        return  UserMapper.mapToUserDto(user);
    }

    @Override
    public List<UserDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream().map((user)-> UserMapper.mapToUserDto(user)).collect(Collectors.toList());
    }

    //UPDATE User
    @Override
    public UserDto updateUser(int userId, UserDto updatedUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not exists with the given id: " + userId));
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail());
        user.setPassword(updatedUser.getPassword());

        User updatedUserObj =  userRepository.save(user);
        return UserMapper.mapToUserDto(updatedUserObj);
    }

    @Override
    public void deleteUser(int userId) {
        boolean exists = userRepository.existsById(userId);
        if (!exists) {
            throw new ResourceNotFoundException("User not exists with the given id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    public User authenticate(String email, String password) {
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getPassword().equals(password)) {
                return user;
            }
        }
        return null;
    }

}


