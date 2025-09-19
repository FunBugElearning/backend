package com.example.funbugProject.Controller;

import com.example.funbugProject.Entity.Attendance;
import com.example.funbugProject.Service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/attendances")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    public List<Attendance> getAllAttendances() {
        return attendanceService.getAll();
    }

    @PostMapping
    public Attendance createAttendance(@RequestBody Attendance attendance) {
        return attendanceService.createAttendance(attendance);
    }

    @PutMapping("/{id}")
    public Attendance updateAttendance(@PathVariable int id, @RequestBody Attendance attendance) {
        return attendanceService.updateAttendance(id, attendance);
    }

    @DeleteMapping("/{id}")
    public void deleteAttendance(@PathVariable int id) {
        attendanceService.deleteAttendance(id);
    }

    @GetMapping("/student/{studentId}")
    public List<Attendance> getAttendanceByStudent(@PathVariable int studentId) {
        return attendanceService.getByStudentId(studentId);
    }
}
