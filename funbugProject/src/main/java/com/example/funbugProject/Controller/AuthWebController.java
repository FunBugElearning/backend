package com.example.funbugProject.Controller;

import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class AuthWebController {

    private final UserService userService;

    @GetMapping("/login")
    public String loginPage() {
        return "login"; // vì file là login.html
    }

    @PostMapping("/login")
    public String loginSubmit(@RequestParam String email,
                              @RequestParam String password,
                              HttpSession session,
                              Model model) {
        User user = userService.authenticate(email, password);

        if (user == null) {
            model.addAttribute("error", "Sai email hoặc mật khẩu!");
            return "login"; // trả lại login.html nếu lỗi
        }

        session.setAttribute("user", user);

        switch (user.getRole()) {
            case STUDENT: return "student"; // student.html
            case TEACHER: return "teacher"; // teacher.html
            case ADMIN:   return "admin";   // admin.html
            default:      return "login";
        }
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }
}
