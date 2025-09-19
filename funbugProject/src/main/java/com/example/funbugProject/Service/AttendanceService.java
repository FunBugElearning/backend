package com.example.funbugProject.Service;

import com.example.funbugProject.Entity.Attendance;
import com.example.funbugProject.Repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    public List<Attendance> getAll() {
        return attendanceRepository.findAll();
    }

    public Attendance createAttendance(Attendance attendance) {
        return attendanceRepository.save(attendance);
    }

    public Attendance updateAttendance(int id, Attendance attendance) {
        attendance.setId(id);
        return attendanceRepository.save(attendance);
    }

    public void deleteAttendance(int id) {
        attendanceRepository.deleteById(id);
    }

    // Lấy điểm danh của học sinh
    public List<Attendance> getByStudentId(int studentId) {
        return attendanceRepository.findAll().stream()
                .filter(a -> a.getStudent() != null && a.getStudent().getId() == studentId)
                .toList();
    }
}
