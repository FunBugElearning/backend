package com.example.funbugProject.Controller;

import com.example.funbugProject.Repository.UserRepository;
import com.example.funbugProject.Security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

@Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        return userRepository.findByEmail(email)
                .map(user -> {
                    if (user.getPassword().equals(password)) {
                        String token = jwtUtil.generateToken(email); // generate token từ email
                        Map<String, Object> response = new HashMap<>();
                        response.put("token", token);
                        response.put("role", user.getRole());
                        response.put("email", user.getEmail());
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.status(401).body("Invalid password");
                    }
                })
                .orElse(ResponseEntity.status(401).body("User not found"));
    }

    // ✅ Check token hợp lệ
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        boolean isValid = jwtUtil.validateToken(token);
        return ResponseEntity.ok(isValid ? "Valid token" : "Invalid token");
    }
}