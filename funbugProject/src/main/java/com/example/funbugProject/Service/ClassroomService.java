package com.example.funbugProject.Service;

import com.example.funbugProject.dto.ClassroomCreateRequest;
import com.example.funbugProject.Entity.Classroom;
import com.example.funbugProject.Entity.ClassroomDetail;
import com.example.funbugProject.Entity.User;
import com.example.funbugProject.Repository.ClassDetailRepository;
import com.example.funbugProject.Repository.ClassroomRepository;
import com.example.funbugProject.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ClassroomService {

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassDetailRepository classDetailRepository;


    //GET All Classroom
    public List<Classroom> getAll() {
        return classroomRepository.findAll();
    }


    //GET Classroom by Name
    public List<Classroom> getClassroomByName(String name) {
        List<Classroom> classroom = classroomRepository.findByName(name);
        return classroom;
    }


    //CREATE Classroom
    public Classroom createClassroom(ClassroomCreateRequest body) {
        Classroom classroom = new Classroom();
        classroom.setClassName(body.getClassName());
        classroom.setTeacher(body.getTeacher());
        return classroomRepository.save(classroom);
    }

    //UPDATE Classroom
    public Classroom updateClassroom(int id, Classroom updatedClassroom) {
        Classroom classroom = classroomRepository.findById(id)
                                                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Class does not exists with give id: " + id));
        classroom.setClassName(updatedClassroom.getClassName());

        Classroom updatedClassroomObj = classroomRepository.save(classroom);
        return classroomRepository.save(updatedClassroomObj);
    }

    //DELETE Classroom
    public void deleteClassroom(int id) {
        classroomRepository.deleteById(id);
    }

    // Add student into classroom
    public Classroom addStudentToClass(int classroomId, String email) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Class does not exist with given id: " + classroomId));

        User student = userRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User does not exist with email: " + email));

        boolean alreadyInClass = classroom.getClassroomDetails() != null
                && classroom.getClassroomDetails().stream()
                .anyMatch(detail -> detail.getStudentId() != null && detail.getStudentId().getId() == student.getId());

        if (alreadyInClass) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student is already in this classroom");
        }

        ClassroomDetail classroomDetail = new ClassroomDetail();
        classroomDetail.setClassroomId(classroom);
        classroomDetail.setStudentId(student);
        classDetailRepository.save(classroomDetail);

        return classroomRepository.findById(classroomId).orElse(classroom);
    }

    // Lấy danh sách lớp theo giáo viên
    public List<Classroom> getByTeacherId(int teacherId) {
        return classroomRepository.findAll().stream()
                .filter(c -> c.getTeacher() != null && c.getTeacher().getId() == teacherId)
                .toList();
    }
}
