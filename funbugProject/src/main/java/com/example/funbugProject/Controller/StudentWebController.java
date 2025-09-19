package com.example.funbugProject.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/student")
public class StudentWebController {

    @GetMapping("/dashboard")
    public String dashboard() {
        return "student-dashboard";
    }

    @GetMapping("/attendance")
    public String viewAttendance() {
        return "student-attendance";
    }

    @GetMapping("/scores")
    public String viewScores() {
        return "student-scores";
    }
}