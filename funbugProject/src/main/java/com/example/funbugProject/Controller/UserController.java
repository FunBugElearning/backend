package com.example.funbugProject.Controller;

import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserService userService;


    //ADD USER REST API
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User savedUser =  userService.createUser(user);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    //Get User by ID REST API
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById (@PathVariable int id, int userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    //Get User AlL REST API
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    //UPDATE User REST API
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable int userId,@RequestBody User updatedUser) {
        User user = userService.updateUser(userId,updatedUser);
        return ResponseEntity.ok(user);
    }

    //DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) {
        userService.deleteUser(id);
        return  ResponseEntity.ok("User deleted successfully!");
    }
}
