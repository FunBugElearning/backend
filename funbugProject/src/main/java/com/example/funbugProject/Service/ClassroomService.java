package com.example.funbugProject.Service;

import com.example.funbugProject.Entity.Classroom;
import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Repository.ClassroomRepository;
import com.example.funbugProject.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClassroomService {

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Classroom> getAll() {
        return classroomRepository.findAll();
    }

    public Classroom createClassroom(Classroom classroom) {
        return classroomRepository.save(classroom);
    }

    public Classroom updateClassroom(int id, Classroom classroom) {
        classroom.setId(id);
        return classroomRepository.save(classroom);
    }

    public void deleteClassroom(int id) {
        classroomRepository.deleteById(id);
    }

    // Thêm học sinh vào lớp
    public Classroom addStudentToClass(int classroomId, int studentId) {
        Classroom classroom = classroomRepository.findById(classroomId).orElse(null);
        User student = userRepository.findById(studentId).orElse(null);

        if (classroom != null && student != null) {
            classroom.getStudents().add(student);
            return classroomRepository.save(classroom);
        }
        return null;
    }

    // Lấy danh sách lớp theo giáo viên
    public List<Classroom> getByTeacherId(int teacherId) {
        return classroomRepository.findAll().stream()
                .filter(c -> c.getTeacher() != null && c.getTeacher().getId() == teacherId)
                .toList();
    }
}
