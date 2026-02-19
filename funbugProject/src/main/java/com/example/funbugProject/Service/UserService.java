package com.example.funbugProject.Service;

import com.example.funbugProject.dto.AuthResponse;
import com.example.funbugProject.dto.UserLoginRequest;
import com.example.funbugProject.dto.UserPayload;
import com.example.funbugProject.dto.UserRegisterRequest;
import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Repository.UserRepository;
import com.example.funbugProject.Security.JwtUtil;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class UserService {

    private UserRepository userRepository;

    private PasswordEncoder passwordEncoder;

    private JwtUtil jwtUtil;

    //CREATE User
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        Optional<User> userOptional = userRepository.findByUserEmail(user.getEmail());
        if (userOptional.isPresent()) {
            throw new IllegalStateException(" User already exists");
        }
        User savedUser = userRepository.save(user);
        return savedUser;
    }
    //GET by ID
    public User getUserById(int userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not exists with the given id: " + userId));
        return user;
    }

    //GET ALL User
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users;
    }

    //UPDATE User
    public User updateUser(int userId, User updatedUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User not exists with the given id: " + userId));
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail());
        user.setPassword(updatedUser.getPassword());

        User updatedUserObj =  userRepository.save(user);
        return updatedUserObj;
    }

    // DELETE User
    public void deleteUser(int userId) {
        boolean exists = userRepository.existsById(userId);
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "User not exists with the given id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    //Login Service
    public AuthResponse login(UserLoginRequest body) {

        User user = userRepository.findByUserEmail(body.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(body.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        // Generate token
        UserPayload payload = new UserPayload(user.getName(),
                                                user.getEmail(),
                                                user.getId());
        String token = jwtUtil.generateToken(payload);

        return new AuthResponse(token, user.getName(), user.getEmail(), user.getId());
    }

    //Register Service
    public AuthResponse register(UserRegisterRequest body) {
        //Check if email exists
        if(userRepository.existsByCustomerEmail(body.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        //Create User
        User user = new User(body.getUsername(),
                            body.getEmail(),
                            body.getPassword()
        );
        User savedUser = userRepository.save(user);

        //Generate Token
        UserPayload payload = new UserPayload(user.getName(),
                                            user.getEmail(),
                                            user.getId()
        );
        String token = jwtUtil.generateToken(payload);

        return new AuthResponse(token,
                                savedUser.getName(),
                                savedUser.getEmail(),
                                savedUser.getId()
        );

    }
    


}


