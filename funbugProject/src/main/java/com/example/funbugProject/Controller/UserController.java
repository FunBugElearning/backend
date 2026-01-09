package com.example.funbugProject.Controller;

import com.example.funbugProject.DTO.UserDto;
import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Service.UserService;
import com.example.funbugProject.Service.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;


    //ADD USER REST API
    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto) {
        UserDto savedUser =  userService.createUser(userDto);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    //Get User by ID REST API
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById (@PathVariable int id, int userId) {
        UserDto userDto = userService.getUserById(userId);
        return ResponseEntity.ok(userDto);
    }

    //Get User AlL REST API
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    //UPDATE User REST API
    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable int userId,@RequestBody UserDto updatedUser) {
        UserDto userDto = userService.updateUser(userId,updatedUser);
        return ResponseEntity.ok(userDto);
    }

    //DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) {
        userService.deleteUser(id);
        return  ResponseEntity.ok("User deleted successfully!");
    }
}
