package com.example.funbugProject.Service;

import com.example.funbugProject.Entity.ClassroomDetail;
import com.example.funbugProject.Repository.ClassDetailRepository;
import com.example.funbugProject.dto.ClasroomDetailCreateRequest;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@NoArgsConstructor
public class ClassroomDetailService {
    private ClassDetailRepository classDetailRepository;
    //CRUD User in Classroom
    
    //POST User to Classroom
    public ClassroomDetail addUserToClassroom(ClasroomDetailCreateRequest body) {
        ClassroomDetail classroomDetail = new ClassroomDetail();
        classroomDetail.setClassroomId(body.getClassroomDetail().getClassroomId());
        classroomDetail.setStudentId(body.getStudentId());
        return classDetailRepository.save(classroomDetail);

   }

    //GET All User
    public List<ClassroomDetail> getAllClassroomDetails() {
        return classDetailRepository.findAll();
    }
    //GET User by ID
    public Optional<ClassroomDetail> getClassroomDetailByStudentId(int studentId) {
        return classDetailRepository.findById(studentId);
    }
    //UDPATE
    public ClassroomDetail updateClassroomDetail(int id, ClassroomDetail classroomDetail) {
        return classDetailRepository.save(classroomDetail);
    }

    //DELETE
    public void deleteClassroomDetail(int id) {
        boolean exists = classDetailRepository.existsById(id);
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Classroom detail not exists with the given id: " + id);
        }
        classDetailRepository.deleteById(id);
    }

}
