package com.example.funbugProject.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/teacher")
public class TeacherWebController {

    @GetMapping("/dashboard")
    public String dashboard() {
        return "teacher-dashboard";
    }

    @GetMapping("/classes")
    public String manageClasses() {
        return "teacher-classes";
    }

    @GetMapping("/students")
    public String manageStudents() {
        return "teacher-students";
    }

    @GetMapping("/scores")
    public String manageScores() {
        return "teacher-scores";
    }

    @GetMapping("/attendance")
    public String manageAttendance() {
        return "teacher-attendance";
    }
}
